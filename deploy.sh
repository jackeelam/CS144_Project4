#!/bin/bash

ZIP_FILE="project4.zip"
WORK_DIR="/tmp/p4-grading/"
EXPRESS_PID_FILE="/var/run/express.pid"
CUR_DIR=$(pwd)

function kill_express()
{
    # kill npm process and the node server
    if [ -f ${EXPRESS_PID_FILE} ]; then
        EXPRESS_PID=$(cat ${EXPRESS_PID_FILE})
        EXPRESS_PGID=$(ps --pid ${EXPRESS_PID} -o pgid | sed -z 's/[^0-9]//g')
        rm -f ${EXPRESS_PID_FILE}
        if [ -n "${EXPRESS_PGID}" ]; then
            echo "Stopping Express-server process group with pgid ${EXPRESS_PGID}..."
            kill -- -${EXPRESS_PGID}
        fi
    fi
}

function cleanup() 
{
    kill_express

    # remove temp files
    if [ "$SRC" = "FILE" ]; then
        cd $CUR_DIR
        rm -rf $WORK_DIR
    fi

    # exit
    exit 0
}

function error_exit()
{
    echo -e "ERROR: $1" 1>&2
    if [ "$SRC" = "FILE" ]; then
        rm -rf $WORK_DIR
    fi
    exit 1
}

function check_files()
{
    for FILE in $1; do
        if [ ! -f ${FILE} ]; then
            error_exit "Cannot find ${FILE} in $2"
        fi
    done
}

CHECK_USER=true
WAIT_FOR_CTRL_C=true

while getopts ":bu" opt; do
    case $opt in
    b)
        WAIT_FOR_CTRL_C=false
        ;;
    u)
        CHECK_USER=false
        ;;
    esac
done
shift $((OPTIND -1))
OPTIND=160

# make sure running in container
if [ ${CHECK_USER} = true -a `whoami` != "cs144" -a `whoami` != "root" ]; then
    error_exit "You need to run this script within the container"
fi

# kill express server
kill_express

# get command line parameter
PARAMETER=$1
if [ -z ${PARAMETER} ]; then
    PARAMETER=${ZIP_FILE}
fi

# check if the source is a zip file or a directory
if [ -f ${PARAMETER} ]; then
    SRC="FILE"
    ZIP_FILE=${PARAMETER}
    echo "Deploying the file ${ZIP_FILE}..."
elif [ -d ${PARAMETER} ]; then
    SRC="DIR"
    WORK_DIR=${PARAMETER}
    echo "Deploying the files in ${WORK_DIR}..."
fi

# if the file/directory does not exist, print the usage statement
if [ -z "${SRC}" ]; then
    echo "Usage: $0 [zip file|directory]" 1>&2
    exit
fi

# if the source is a zip file, unzip it
if [ "${SRC}" = "FILE" ]; then
    # clean any existing files
    rm -rf ${WORK_DIR}
    mkdir ${WORK_DIR}

    # unzip the submission zip file
    if [ ! -f ${ZIP_FILE} ]; then
        error_exit "Cannot find $ZIP_FILE"
    fi
    unzip -q -d ${WORK_DIR} ${ZIP_FILE}
    if [ $? -ne 0 ]; then
        error_exit "Cannot unzip ${ZIP_FILE} to ${WORK_DIR}"
    fi
fi

# move to the main directory
cd ${WORK_DIR}

# check a few required files
check_files "blog-server/package.json blog-server/db.sh angular-blog/package.json angular-blog/angular.json angular-blog/dist/angular-blog/index.html" "root directory"

# drop all collections in BlogServer database
echo
echo "Deleting all documents and collections in the BlogServer database..."
cat << EOF | mongo &> /dev/null
    use BlogServer;
    db.dropDatabase();
EOF

# load initial documents to mongodb
echo "Loading initial documents to MongoDB using your db.sh..."
mongo < blog-server/db.sh &> /dev/null

# deploy the angular-blog files to the node server
echo "Deploying your Angular code to the node server..."
rm -rf blog-server/public/editor
cp -rf angular-blog/dist/angular-blog blog-server/public/editor

# run npm install in blog-server
echo "Installing dependent node modules..."
cd blog-server
npm install &> /dev/null
if [ $? -ne 0 ]; then
    error_exit 'Failed to run "npm install" in your blog-server directory'
fi

# run the blog server
npm start &
if [ $? -ne 0 ]; then
    error_exit 'Failed to run "npm start" in your blog-server directory.\nIs your code in a runable state? Are you running another server at port 3000?'
fi
echo "$!" > ${EXPRESS_PID_FILE}

if [ ${WAIT_FOR_CTRL_C} = true ]; then
    sleep 1

    echo "Test deployment finished! Now your server is running at http://localhost:3000/"
    echo "Visit http://localhost:3000/editor/ and make sure everything works as expected."
    echo "To stop the server, press Ctrl+C"

    # trap ctrl-c and call cleanup
    trap cleanup INT 
    sleep 100000
    cleanup
fi
