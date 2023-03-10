
// Globals
var globalMap = null; // the global mapping
var globalImg = null

// Globals for zoom
var scale = 1
var panning = false
var pointX = 0
var pointY = 0
var start = { x: 0, y: 0 }
var zoom = null // later set in main


function isCheckboxConfig(name) {
  return document.getElementById(name).checked
}


function changeBackgroundImage(url) {
  // Changes the background image to the given url
  // If the url is empty it is not changed.
  if (url == "") {return}
  let bgimg = document.getElementById("backgroundImage")
  bgimg.src = url
  globalImg = url
}

async function changeBackgroundImageAttachment(attachmentRecord) {
  // Changes the background image to the given url
  // If the url is empty it is not changed.
  const tokenInfo = await grist.docApi.getAccessToken({readOnly: true});
  const id = attachmentRecord.bgImageAttachment[0];
  const src = `${tokenInfo.baseUrl}/attachments/${id}/download?auth=${tokenInfo.token}`;
  let bgimg = document.getElementById("backgroundImage")
  bgimg.src = src;
  globalImg = src;


  //if (url == "") {return}
  //let bgimg = document.getElementById("backgroundImage")
  //bgimg.src = url
  //globalImg = url
}

function getDefaultBgImage() {
  const params = new URLSearchParams(location.search);
  let backgroundImage = params.get("backgroundImage")
  return backgroundImage
}


function getCurrentBgImage() {
  // let bgimg = document.getElementById("backgroundImage");
  // return bgimg.src
  return globalImg;
}


function removeAllHighlights() {
  var highlights = document.getElementsByClassName("highlight")
  for (let index = 0; index < highlights.length; index++) {
    const element = highlights[index];
    element.classList.remove("highlight")
  }
}

function hideAllThatAreOnAnotherImage() {
  // This function hides all entries that should be on another image
  let items = document.getElementsByClassName("item")

  let currentBg = getCurrentBgImage()
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    let itemBg = JSON.parse(atob(item.dataset.recordjson)).bgImage
    if ((itemBg == "") || (currentBg == itemBg)) {
      item.style.display = "inherit"
      console.log("Show:", item, "itembg", itemBg, "CurrentBg", currentBg)
    } else {
      item.style.display = "none"
      console.log("Hide:", item, itemBg, "CurrentBg", currentBg)
    }

  }
}

// Grist handlers
function gristOnRecordHandler(recordRaw, mappings) {
  // {id: 1, Title: 'aaa', X: 10, Y: 20}
  const record = grist.mapColumnNames(recordRaw);
  globalMap = mappings // TODO set the global mapping here, idk where else
  console.log(record, mappings);
  let doc = document.querySelector('[data-gristid="' + recordRaw.id + '"]');
  if (doc === null){return}
  removeAllHighlights();
  console.log("Add highlight to:", doc)
  doc.classList.add("highlight");
  if (isCheckboxConfig("scrollIntoView")) {
    doc.scrollIntoView({behavior: "auto", block: "center", inline: "center"})
  }
  if (record["bgImage"] == "") {
    changeBackgroundImage(getDefaultBgImage());
    record["bgImage"] = getDefaultBgImage();
  } else {
    changeBackgroundImage(record["bgImage"]);
  }
  //if (record["bgImageAttachment"] == "") {
  //  //changeBackgroundImage(getDefaultBgImage());
  //} else {
  //  changeBackgroundImageAttachment(record);
  //}
  hideAllThatAreOnAnotherImage()

}


function gristOnRecordsHandler(records, mappings) {
  // {id: 1, Title: 'aaa', X: 10, Y: 20}
  console.log("gristOnRecorsdHandler", records)
  globalMap = mappings // TODO set the global mapping here, idk where else
  for (let idx = 0; idx < records.length; idx++) {
    var recordRaw = records[idx];
    const record = grist.mapColumnNames(recordRaw);

    // TODO we filter elements based on their image.
    // So we only show elements that SHOULD be on this image.
    // if (record.bgImage != getCurrentBgImage()) {
    //   return
    // }

    let doc = document.querySelector('[data-gristid="' + recordRaw.id + '"]')
    if (doc === null) {
      // Not found create!
      console.log("create elem", record)
      var elem = document.createElement("div")
      elem.classList.add("item")
      elem.dataset.recordjson = btoa(JSON.stringify(record));
      elem.dataset.gristid = recordRaw.id
      elem.dataset.x = record.X
      elem.dataset.y = record.Y
      elem.innerText = record.Title
      elem.style.top = "0px";
      elem.style.color = record.fgColor;
      elem.style.backgroundColor = record.bgColor;
      elem.style.fontSize = record.fontSize + "px";
      var obj = container.appendChild(elem);
      positionElement(obj, elem.dataset.x , elem.dataset.y)
    } else {
      // Found change it!
      doc.dataset.x = record.X
      doc.dataset.y = record.Y
      doc.innerText = record.Title
      doc.style.color = record.fgColor;
      doc.style.backgroundColor = record.bgColor;
      doc.style.fontSize = record.fontSize + "px";
      doc.dataset.recordjson = btoa(JSON.stringify(record));
    }
  } // for end

  hideAllThatAreOnAnotherImage()
}


function gristOnOptions (options, interaction) {
  // Configuration has changed.
  console.log("OPTIONSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", options, interaction)
}


// Interact js handlers
function tapListener(event) {
  // This should later select the grist row
  console.log("Tap: ", event);
  if (isCheckboxConfig("showDetails")) {
    // let details = JSON.stringify(JSON.parse(atob(event.target.dataset.recordjson)), null, 2)
    let details = JSON.parse(atob(event.target.dataset.recordjson))
    let detailsobj = document.getElementById("details");
    detailsobj.style.display = "block";

    document.getElementById("detailsTitle").innerText = details.Title
    document.getElementById("detailsText").innerText = details.details.join("\n");
  }
}


function positionElement(elem, x, y, scale = 1) {
  // console.log("positionElement", elem, x, y)
  // translate the element
  elem.style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(' + scale + ')'

  // update the posiion attributes
  elem.setAttribute('data-x', x)
  elem.setAttribute('data-y', y)
  elem.setAttribute('data-scale', scale)
}


function dragMoveListener(event) {
  // This should later do nothing IN grist, but show some data
      // console.log(event.pageX,
      //             event.pageY)
      // console.log(event.target)
  if (!isCheckboxConfig("moveEnabled")){
    interact.stop();
    return false
  }

  var container = document.getElementById("container")
  var target = event.target
  // keep the dragged position in the data-x/data-y attributes
  var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx / container.dataset.scale
  var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy / container.dataset.scale
  positionElement(target, x , y)
}


function dragEndListener(event) {
  // This writes back the position to the grist row
  console.log(
    "Drag ended: ",
    event, event.target,
    event.target.dataset.gristid
  );
  // grist.selectedTable.updateRecords({"X": [900], "Y": [100]}, [1])
  // we must map back to the original values
  let payload = {}
  payload[globalMap["X"]] = [Number(event.target.dataset.x)]
  payload[globalMap["Y"]] = [Number(event.target.dataset.y)]
  grist.selectedTable.updateRecords(payload, [Number(event.target.dataset.gristid)])
}


function main() {
  // The main function that gets executed when the dom is ready
  // Get the bgimage from the query params
  backgroundImage = getDefaultBgImage();
  changeBackgroundImage(backgroundImage);

  grist.ready({
      requiredAccess: 'full',
      columns: [
        'Title',
        'X',
        'Y',
        {name:'fontSize', optional: true},
        {name:'bgColor', optional: true},
        {name:'fgColor', optional: true},
        {name:'details', optional: true, allowMultiple: true},
        {name:'bgImage', optional: true},
        // {name:'bgImageAttachment', optional: true}
      ],
    });
  grist.onRecord(gristOnRecordHandler);
  grist.onRecords(gristOnRecordsHandler);
  grist.onOptions(gristOnOptions);
  grist.onRec
  // Setup interaction
  // interact('.item').draggable({
  interact('.itemMoveable').draggable({
    autoScroll: true,
    listeners: {
      move: dragMoveListener,
      end: dragEndListener,
    },
    modifiers: [
      // interact.modifiers.snap({
      //   targets: [
      //     interact.snappers.grid({ x: 30, y: 30 })
      //   ],
      //   offset: "parent",
      //   range: Infinity,
      //   relativePoints: [ { x: 0, y: 0 } ]
      // }),
    ]
  })
  interact('.item').on("tap", tapListener)

  interact('.container').draggable({
    listeners: {
        move: dragMoveListenerContainer,
        //end: dragEndListener,
      },
  });

} // main end



function dragMoveListenerContainer(event) {
  // Drag to scroll
  // window.scrollTo(event.x0 - event.clientX, event.y0 - event.clientY)
  var target = event.target
  // keep the dragged position in the data-x/data-y attributes
  var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
  var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy
  positionElement(target, x , y, target.dataset.scale)
}

// function initZoom() {
//   // Zoom copy paste
//   var zoom = document.getElementById("container")
//   function setTransform() {
//     zoom.style.transform = "translate(" + pointX + "px, " + pointY + "px) scale(" + scale + ")";
//   }

//   zoom.onmousedown = function (e) {
//     e.preventDefault();
//     start = { x: e.clientX - pointX, y: e.clientY - pointY };
//     panning = true;
//   }

//   zoom.onmouseup = function (e) {
//     panning = false;
//   }

//   zoom.onmousemove = function (e) {
//     e.preventDefault();
//     if (!panning) {
//       return;
//     }
//     pointX = (e.clientX - start.x);
//     pointY = (e.clientY - start.y);
//     setTransform();
//   }

//   zoom.onwheel = function (e) {
//     e.preventDefault();
//     var xs = (e.clientX - pointX) / scale,
//       ys = (e.clientY - pointY) / scale,
//       delta = (e.wheelDelta ? e.wheelDelta : -e.deltaY);
//     (delta > 0) ? (scale *= 1.2) : (scale /= 1.2);
//     pointX = e.clientX - xs * scale;
//     pointY = e.clientY - ys * scale;

//     setTransform();
//   }
// // zoom copy paste end
// }

function initZoom2() {
  let zoom = document.getElementById("container") //.style.transform = "scale(0.2)"
  var scale = 1
  var scaleSpeed = 1.1;
  zoom.onwheel = function (e) {
    e.preventDefault();
    var pointX = zoom.dataset.x
    var pointY = zoom.dataset.y
    var xs = (e.clientX - pointX) / scale
    var ys = (e.clientY - pointY) / scale
    var delta = (e.wheelDelta ? e.wheelDelta : -e.deltaY);
    (delta > 0) ? (scale *= scaleSpeed) : (scale /= scaleSpeed);
    pointX = e.clientX - xs * scale;
    pointY = e.clientY - ys * scale;
    positionElement(zoom, pointX, pointY, scale)
  }
}

function initSettings() {
  let resetZoom = document.getElementById("resetZoom");
  resetZoom.addEventListener("click", function (ev) {
    let container = document.getElementById("container");
    positionElement(container, 0, 0, 1);
  })

  let moveEnabled = document.getElementById("moveEnabled");
  moveEnabled.addEventListener("change", function (ev) {
    let items = document.getElementsByClassName("item")
    if(this.checked) {
      // We can move, disable user select etc
      // TODO enable drag and drop
      document.getElementById("scrollIntoView").checked = false;
      for (let index = 0; index < items.length; index++) {
        const element = items[index];
        console.log("add")
        element.classList.add("itemMoveable");
      }

    } else {
      // We cannot move, enable user select etc
      // TODO disable drag and drop
      for (let index = 0; index < items.length; index++) {
        const element = items[index];
        console.log("remove")
        element.classList.remove("itemMoveable");
      }

    }
  })

  let scrollIntoView = document.getElementById("scrollIntoView");
  scrollIntoView.addEventListener("change", function (ev) {
    if(this.checked) {
      let moveEnabled = document.getElementById("moveEnabled")
      moveEnabled.checked = false;
      var event = new Event('change');
      moveEnabled.dispatchEvent(event);
    }
  })
}

function initDetails() {
  let detailsClose = document.getElementById("detailsClose");
  detailsClose.addEventListener("click", function (ev) {
    document.getElementById("details").style.display = "none";
  })
}

window.addEventListener('DOMContentLoaded', (event) => {
    main()
    // initZoom()
    initZoom2()
    initSettings()
    initDetails()
});
