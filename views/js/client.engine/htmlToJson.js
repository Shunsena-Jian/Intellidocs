let ele_key = 0;

function getNewKeyID(element) {
  const firstAttribute = element.ele_attributes[Object.keys(element.ele_attributes)[0]];

  if (firstAttribute !== null) {
    const currentKey = parseInt(firstAttribute, 10);

    if (!isNaN(currentKey) && currentKey >= ele_key) {
      const serializedHTML = document.documentElement.outerHTML;
      const largestKey = detectLargestKeyInHtml(serializedHTML);
      ele_key = largestKey + 1;
    }
  } else {
    const counter = ele_key;
    ele_key++;
    element.ele_attributes.key = counter.toString();
  }

  for (const childElement of element.ele_contents) {
    if (typeof childElement === 'object') {
      getNewKeyID(childElement);
    }
  }
}


function detectLargestKeyInHtml(element) {
  const { document } = new JSDOM(element).window;
  const elementsWithKeyAttribute = document.querySelectorAll('[key]');

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

function elementToJson(element) {
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
            if (childNode.nodeType === 1) { // node type '1' is element in the DOM (Document Object Model)
                const childJson = elementToJson(childNode);
                jsonElementFormat.ele_contents.push(childJson);
            } else if (childNode.nodeType === 3) { // node type '3' is text in the DOM (Document Object Model)
                const trimmedText = childNode.textContent.trim();
                if (trimmedText !== '') {
                    jsonElementFormat.ele_contents.push(trimmedText);
                }
            }
        }
    }

    return jsonElementFormat;
}