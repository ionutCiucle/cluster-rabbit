import fsp from 'fs-promise';
import Promise from 'bluebird';

//we don't need multiple instances of item-controller per process
//it only provides the functionality related to loading data
//therefore, we'll be using a plain object

const itemIo = {
    loadItems(sourceFilePath) {
        return new Promise((resolve, reject) => {
            try {
                fsp.readFile(sourceFilePath).then(
                    (inputData) => {
                        resolve(JSON.parse(inputData.toString()));
                    }, (rejectData) => {
                        reject(rejectData);
                    }
                );
            } catch(e) {
                reject(e);
            }
        });
    },
    sendItem(item, targetFilePath) {
        return new Promise((resolve, reject) => {
            try {
                fsp.appendFile(targetFilePath, JSON.stringify(item) + '\n').then(
                    () => {
                        console.log(`Successfully sent ${item}`);
                        resolve();
                    }, (rejectData) => {
                        reject(rejectData);
                    });
            } catch(e) {
                reject(e);
            }
        });
    }
};

export default itemIo;
