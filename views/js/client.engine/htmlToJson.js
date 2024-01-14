var formBody;

function elementToJson(element,inputFieldValuesJSON) {
    const jsonElementFormat = {
        ele_type: element.nodeName ? element.nodeName.toLowerCase() : 'unknown',
        ele_attributes: {
            key: null,
        },
        ele_contents: [],
    };

    if (element.attributes) {
        for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes.item(i);
            jsonElementFormat.ele_attributes[attr.name] = attr.value;
        }
    }



    if (element.childNodes) {
        for (let i = 0; i < element.childNodes.length; i++) {
            const childNode = element.childNodes[i];
            if (childNode.nodeType === 1) { // Element node
                const childJson = elementToJson(childNode,inputFieldValuesJSON);
                jsonElementFormat.ele_contents.push(childJson);
            } else if (childNode.nodeType === 3) { // Text node
                const trimmedText = childNode.textContent.trim();
                if (trimmedText !== '') {
                    jsonElementFormat.ele_contents.push(trimmedText);
                }
            }
        }
    }

    if (element.nodeName.toLowerCase() === 'input') {
            const inputType = element.getAttribute('type');
            const inputKeyAttribute = element.getAttribute('key');

            if (inputType) {
                const inputElement = inputFieldValuesJSON.find(item => Object.keys(item)[0] === inputKeyAttribute);

                if (inputElement) {
                    const inputValueFromJson = inputElement[inputKeyAttribute];
                    if (inputValueFromJson !== null) {
                        jsonElementFormat.ele_attributes.key = inputKeyAttribute;

                        if (inputType.toLowerCase() === 'text' || inputType.toLowerCase() === 'date' || inputType.toLowerCase() === 'number') {
                            jsonElementFormat.ele_attributes.value = inputValueFromJson;
                        } else if (inputType.toLowerCase() === 'checkbox' || inputType.toLowerCase() === 'radio') {
                            if(inputValueFromJson==="checked"){
                            jsonElementFormat.ele_attributes.checked = element.checked;
                            }
                        }
                    }
                }
            }
        }
    return jsonElementFormat;
}
//GLOBAL AT THIS POINT
let ele_key = 0;

function getNewKeyID(element) {
    const firstAttribute = element.ele_attributes[Object.keys(element.ele_attributes)[0]];

    if(firstAttribute !== null){
        const currentKey = parseInt(firstAttribute, 10);

        if(!isNaN(currentKey) && currentKey >= ele_key){
        const serializedHTML = document.documentElement.outerHTML; // kailangan muna istore sa string para magamit yung detectlargestkey
        const asd = detectLargestKeyInHtml(serializedHTML);
            ele_key = asd + 1;
        }
    }else{
        counter = ele_key;
        ele_key = ele_key + 1;
        element.ele_attributes.key = counter.toString();
    }

    for(const childElement of element.ele_contents){
        if(typeof childElement === 'object'){
            getNewKeyID(childElement);
        }
    }
}

function detectLargestKeyInHtml(element) {
    // Create a temporary div element
    const tempDiv = document.createElement('div');

    // Set its innerHTML to the provided HTML string
    tempDiv.innerHTML = element;

    // Query all elements with the "key" attribute
    const elementsWithKeyAttribute = tempDiv.querySelectorAll('[key]');

    // Initialize a variable to store the maximum key
    let maxKey = 0;

    // Iterate through the elements
    elementsWithKeyAttribute.forEach(element => {
      // Get the "key" attribute value as a string
      const keyAttribute = element.getAttribute('key');

      // Check if it's a valid number and if it's greater than the current maxKey
      if (!isNaN(keyAttribute) && parseInt(keyAttribute, 10) > maxKey) {
        maxKey = parseInt(keyAttribute, 10);
      }
    });

    console.log('The largest key is:', maxKey);
    return maxKey;
}

function iterateAndGetData() {
	var x = document.getElementById("enginePlaceHolder");

    // Get all HTML elements
    var allElements = x.querySelectorAll('*');


    // Array to store the results
    var resultJson = [];

    // Iterate through each element
    allElements.forEach(function(element) {
        // Check if the element is an input
        if (element.nodeName.toLowerCase() === 'input') {
            var inputType = element.getAttribute('type');
            var inputKeyAttribute = element.getAttribute('key');

            // Check if the input has a key attribute
            if (inputKeyAttribute) {
                var inputValue;

                // Check input type
                if (inputType.toLowerCase() === 'text' || inputType.toLowerCase() === 'date' || inputType.toLowerCase() === 'number') {
                    inputValue = element.value;
                } else if (inputType.toLowerCase() === 'checkbox' || inputType.toLowerCase() === 'radio') {
                    inputValue = element.checked ? 'checked' : 'unchecked';
                }

                // Create an object with key-value pair and push it to the resultArray
                var elementData = {};
                elementData[inputKeyAttribute] = inputValue;
                resultJson.push(elementData);
            }
        }
    });

    return resultJson;
}