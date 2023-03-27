function displayText() {
  const params = new URLSearchParams(location.search);
  let text = params.get("text")
  if (text) {
    document.getElementById("text").innerText = decodeURI(atob(text))
  }
}

function encode(str) {
  return location.origin + location.pathname + "?text=" + btoa(encodeURI(str))
}


window.addEventListener('DOMContentLoaded', function() {
  console.log("bound")
  document.getElementById("in").addEventListener("input", function (ev) {
    let encoded = encode(this.value)
    console.log(encoded)

    document.getElementById("out").value = encoded;


    document.getElementById("outlink").innerText = encoded;
    document.getElementById("outlink").href = encoded;
  })
})