'use strict';

module.exports = async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
}


// Description of how to use this: https://codeburst.io/javascript-async-await-with-foreach-b6ba62bbf404