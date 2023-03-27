// maybe this works withouth globals
let currentId = -1
var currentDocument = null
var currentMapping = null
var directions = {
  "get": "Get",
  "put": "Put"
}
var gridDimensions = {
  "width": 9,
  "height": 9
}


function parseToList(str) {
  if (str == "") {return []}
  let parts = str.split("-")
  if (parts.length == 2) {
    let min = Number(parts[0])
    let max = Number(parts[1])
    if(min < max) {
      let result = []
      for (let idx = min; idx <= max; idx++ ) {
        result.push(String(idx))
      }
      return result
    }
  }
  return []
}

function toggleClass(elem, classname) {
  // returns true if the class was added, false if it was removed
  if (elem.classList.contains(classname)) {
    elem.classList.remove(classname)
    return false
  } else {
    elem.classList.add(classname)
    return true
  }
}


function changeClass(oldClassName, newClassName) {
  let objs = document.getElementsByClassName("gridelem");
  for (let index = 0; index < objs.length; index++) {
    const element = objs[index];
    if (element.classList.contains(oldClassName) || element.classList.contains(newClassName)) {
      element.classList.remove(oldClassName)
      element.classList.add(newClassName)
    }
  }
}


function listToDict(lst) {
  let pdic = {}
  for (let index = 0; index < lst.length; index++) {
    const element = lst[index];
    pdic[element] = ""
  }
  return pdic
}


function removeElement(lst, value) {
  let index = lst.indexOf(value);
  if (index == -1){return lst} // do nothing if the element was not found
  return lst.splice(index, 1);
}


async function genGrid(width, height, elem) {
  let cnt = 0
  let table = document.createElement("table");

  for (let hh = 0; hh < height; hh++) {
    let tr = document.createElement("tr")
    for (let ww = 0; ww < width; ww++) {
        cnt += 1;
        let td = document.createElement("td");
        td.innerText = cnt;
        td.id = cnt;
        td.classList.add("gridelem")
        td.addEventListener("click", function(ev) {
          let wasAdded
          if (currentDocument.direction == directions["put"]) {
            wasAdded = toggleClass(ev.target, "insert");
          }
          if (currentDocument.direction == directions["get"]) {
            wasAdded = toggleClass(ev.target, "remove");
          }

          let list = currentDocument.Position || [] // if list not there create
          if (wasAdded) {
            list.push(String(ev.target.id))
          } else {
            removeElement(list, String(ev.target.id))
          }

          fillPosition(list) // Update the table

        })

        tr.appendChild(td);

    }
    table.appendChild(tr);
  }

  elem.appendChild(table)
}


function wipeClass(classname) {
  let objs = document.querySelectorAll('*');
  for (let index = 0; index < objs.length; index++) {
    const element = objs[index];
    element.classList.remove(classname)
  }
}


function colorTheGrid(recordRaw) {
  wipeClass("insert")
  wipeClass("remove")
  if (recordRaw.Position != null) {
    for (let index = 0; index < recordRaw.Position.length; index++) {
      const element = recordRaw.Position[index];
      obj = document.getElementById(element)
      if(recordRaw.direction == directions["put"]) {
        obj.classList.add("insert");
      }
      if(recordRaw.direction == directions["get"]) {
        obj.classList.add("remove");
      }
    }
  }
}


function gristOnRecordHandler(recordRaw, mappings) {
  let record = grist.mapColumnNames(recordRaw);
  if (currentDocument != null) {
    if ((record.Eingetragen != currentDocument.Eingetragen) || (record.Ausgetragen != currentDocument.Ausgetragen)) {
      changeClass()
    }
  }
  currentDocument = record;
  currentMapping = mappings;
  currentId = record.id
  colorTheGrid(record)
}

function gristOnRecordsHandler(records, mappings) {}

function gristOnOptionsHandler(options, interaction) {}


function getQueryParams() {
  // Get the direction verbs from the query url
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  if (urlParams.has("get")) {
    directions["get"] = urlParams.get('get')
  }
  if (urlParams.has("put")) {
    directions["put"] = urlParams.get('put')
  }
  if (urlParams.has("width")) {
    gridDimensions["width"] = urlParams.get('width')
  }
  if (urlParams.has("height")) {
    gridDimensions["height"] = urlParams.get('height')
  }
}

function fillPosition(list) {
  // Update the column that is mapped to position with entries from list
  let fields = {}
  fields[currentMapping["Position"]] =  ["L"].concat(list)
  grist.selectedTable.update({
    id: currentDocument.id,
    fields: fields
  })
}

function main() {
  // The main function that gets executed when the dom is ready
  getQueryParams()
  genGrid(
    gridDimensions["width"],
    gridDimensions["height"],
    document.getElementById("container")
  )
  grist.ready({
      requiredAccess: 'full',
      columns: [
        "direction", // the direction
        {
          name: "Position",
          type: "ChoiceList"
        }, // the position choice list
      ],
      onEditOptions: function() {
      },
    });
  grist.onRecord(gristOnRecordHandler);
  grist.onRecords(gristOnRecordsHandler);
  grist.onOptions(gristOnOptionsHandler);


  // Fill positon button and parser
  function fillPositionWithParser() {
    list = parseToList(document.getElementById("fillpositioninput").value)
    if(list == []){return}
    fillPosition(list)
  }

  document.getElementById("fillpositionbutton").addEventListener("click", function (ev) {
    fillPositionWithParser()
  })

  document.getElementById("fillpositioninput").addEventListener("keyup", function(ev) {
    if (ev.key === "Enter") {
        fillPositionWithParser()
    }
  });

} // main

window.addEventListener('DOMContentLoaded', (event) => {
    main()
});