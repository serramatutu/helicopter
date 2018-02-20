'use strict';

function binaryFind(array, searchElement, comparer) {
    var minIndex = 0;
    var maxIndex = array.length - 1;
    var currentIndex;
    var currentElement;
    var comparison;

    while (minIndex <= maxIndex) {
        currentIndex = (minIndex + maxIndex) / 2 | 0;
        currentElement = array[currentIndex];
        comparison = comparer(currentElement, searchElement);
        
        if (comparison < 0) {
            minIndex = currentIndex + 1;
        }
        else if (comparison > 0) {
            maxIndex = currentIndex - 1;
        }
        else {
              return { // Modification
                  found: true,
                  index: currentIndex
              };
        }
    }      

    return { // Modification
        found: false,
        index: currentElement < searchElement ? currentIndex + 1 : currentIndex
    };
}