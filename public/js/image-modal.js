function openImageModal(src) {
  document.getElementById("image-modal").style.display = "flex";
  document.getElementById("image-modal-img").src = src;
}

function closeImageModal(event) {
  if (event.target.id === "image-modal" || event.target.className === "image-modal-close") {
    document.getElementById("image-modal").style.display = "none";
  }
}