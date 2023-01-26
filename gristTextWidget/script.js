function displayText() {
  if (location.search) {
    document.getElementById("text").innerText = decodeURI(location.search.substring(1))
  }
}