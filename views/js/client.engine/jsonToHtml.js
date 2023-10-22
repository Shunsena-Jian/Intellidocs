
function jsonToHTML(jsonDataArray, indentLevel = 0) {
  const selfClosingTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
  const indent = '    '.repeat(indentLevel); // Four spaces per level

  let html = '';

  for (const jsonData of jsonDataArray) {
    html += `${indent}<${jsonData.ele_type}`;

    // Add attributes
    for (const [attributeName, attributeValue] of Object.entries(jsonData.ele_attributes)) {


      html += ` ${attributeName}="${attributeValue}"`;

      // add ng if else dito kung gustong i-as is na integer ang ibabato na key sa html
    }

    // Check if the element is a self-closing tag
    const isSelfClosing = selfClosingTags.includes(jsonData.ele_type);

    if (isSelfClosing) {
      html += '>\n'; // Add a self-closing slash and newline
    } else {
      html += '>\n'; // Add a newline after the opening tag

      // Add child elements with increased indentation
      for (const child of jsonData.ele_contents) {
        if (typeof child === 'object') {
          html += jsonToHTML([child], indentLevel + 1);
        } else {
          html += `${'    '.repeat(indentLevel + 1)}${child}\n`;
        }
      }

      html += `${indent}</${jsonData.ele_type}>\n`; // Add a newline after the closing tag
    }
  }

  return html;
}