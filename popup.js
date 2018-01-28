var images = [
  {src: 'OverlayImages/mustache.png', name: 'mustache', target: 'upperLipTop', scale: 1, valid: function(face) { return face.faceAttributes.facialHair.moustache < 0.5 }},
  {src: 'OverlayImages/redheadhair.png', name: 'red hair', target: 'headTop', scale: 3.3},
    {src: 'OverlayImages/brown.png', name: 'brown hair', target: 'headTop', scale: 3.3},
]

document.addEventListener('DOMContentLoaded', function() {

  images.forEach(function(image){
    $('form').append($('<input type="checkbox">').attr('name', image.name))
    $('form').append($('<label>').text(image.name))
  })
  $('form').on('change', function(){
    var selected = [];
    $(this).serializeArray().forEach(function(e) {
      selected.push(e.name)
    });
    console.log('got here')
    var selectedImages = [];
    images.forEach(function(image) {
      if (selected.indexOf(image.name) !== -1) {

        selectedImages.push(image);
      }
    });
    var data = {
      'type': 'images',
      'images': selectedImages
    }

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, data, function(response){
          
      });
    });
  })


  var addExtensionsButton = document.getElementById('addExtensions');
  addExtensionsButton.addEventListener('click', function() {

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {'type': 'apply'}, function(response){
          
      });
    });
   
  });

      
}, false);

