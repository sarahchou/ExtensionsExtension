var images = [
  {src: 'OverlayImages/mustache.png', name: 'mustache', target: 'upperLipTop', scale: 1, valid: function(face) { return face.faceAttributes.facialHair.moustache < 0.5 }},
  {src: 'OverlayImages/redheadhair.png', name: 'red hair', target: 'headTop', scale: 3.3},
  {src: 'OverlayImages/brown.png', name: 'brown hair', target: 'headTop', scale: 3.3},
]

function resizeImageWithAspectRatio(img, maxWidth, maxHeight) {
	var ratio = 0;  // Used for aspect ratio
	var width = img[0].naturalWidth;    // Current image width
	var height = img[0].naturalHeight;  // Current image height
 	console.log(width, height, img)
	// Check if the current width is larger than the max
	if(width > maxWidth){
		ratio = maxWidth / width;   // get ratio for scaling image
		img.css("width", maxWidth); // Set new width
		img.css("height", height * ratio);  // Scale height based on ratio
		height = height * ratio;    // Reset height to match scaled image
		width = width * ratio;    // Reset width to match scaled image
	}
 
	// Check if current height is larger than max
	if(height > maxHeight){
		ratio = maxHeight / height; // get ratio for scaling image
		img.css("height", maxHeight);   // Set new height
		img.css("width", width * ratio);    // Scale width based on ratio
		width = width * ratio;    // Reset width to match scaled image
	 }
}

function overlayImg(element, face, imageData) {
    var $element = $(element);
	var offset = $element.offset();
	var scaleX = $element.width() / element.naturalWidth;
	var scaleY = $element.height() / element.naturalHeight;
	var width = (face.faceRectangle.width * scaleX) * imageData.scale;
	var height = (face.faceRectangle.height * scaleY) * imageData.scale;
	var $img = $('<img>').attr('src', chrome.extension.getURL(imageData.src))
	
	$img.on('load', function(event) {
		var pitch = face.faceAttributes.headPose.pitch;
		var roll = face.faceAttributes.headPose.roll;
		var yaw = face.faceAttributes.headPose.yaw;

		resizeImageWithAspectRatio($img, width, height);
		var translateX = imageData.translateX || -50;
		var translateY = imageData.translateY || -50;

		var css = {
			'position': 'absolute',
			'transform': 'translate(' + translateX + '%, ' + translateY + '%) rotate(' + roll + 'deg)',
			'left': offset.left + face.faceLandmarks[imageData.target].x * scaleX,
			'top': offset.top + face.faceLandmarks[imageData.target].y * scaleY

		};
		console.log(css);

		$img.css(css);
		$img.addClass('face');

		
	});
	$('body').append($img);
}

function isFace(element) {
	if ($(element).data('face')) {
		return;
	}
	$(element).data('face', true);
    // **********************************************
    // *** Update or verify the following values. ***
    // **********************************************

    // Replace the subscriptionKey string value with your valid subscription key.
    var subscriptionKey = "133a82601995433daf6d35cf681bf256";

    // Replace or verify the region.
    //
    // You must use the same region in your REST API call as you used to obtain your subscription keys.
    // For example, if you obtained your subscription keys from the westus region, replace
    // "westcentralus" in the URI below with "westus".
    //
    // NOTE: Free trial subscription keys are generated in the westcentralus region, so if you are using
    // a free trial subscription key, you should not need to change this region.
    var uriBase = "https://westcentralus.api.cognitive.microsoft.com/face/v1.0/detect";

    // Request parameters.
    var params = {
        "returnFaceId": "true",
        "returnFaceLandmarks": "true",
        "returnFaceAttributes": "accessories,facialHair,hair,headPose"
    };

    console.log(element.src)
    // Perform the REST API call.
    $.ajax({
        url: uriBase + "?" + $.param(params),

        // Request headers.
        beforeSend: function(xhrObj){
            xhrObj.setRequestHeader("Content-Type","application/json");
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
        },

        type: "POST",

        // Request body.
        data: '{"url": ' + '"' + element.src + '"}',
    })

    .done(function(data) {
    	if (data.length > 0) {
    		console.log(data);
    		data.forEach(function(face) {
    			face.faceLandmarks['headTop'] = {x: face.faceRectangle.left + face.faceRectangle.width / 2, 
    				y: face.faceRectangle.top + face.faceRectangle.width - (face.faceRectangle.width / 10)}
    			console.log("HeadtopX is: " + face.faceRectangle.left + face.faceRectangle.width / 2)
    			console.log("HeadtopY is: " + face.faceRectangle.top + face.faceRectangle.width)

    			images.forEach(function(imageData) {
    				console.log(imageData);
        			if (!imageData.valid || imageData.valid(face)) {
        				overlayImg(element, face, imageData);
        			}
    			});
    		});
    	} else {
    		console.log("Not adding to: " + element.src)
    	}
    })

    .fail(function(jqXHR, textStatus, errorThrown) {
        // Display error message.
        var errorString = (errorThrown === "") ? "Error. " : errorThrown + " (" + jqXHR.status + "): ";
        errorString += (jqXHR.responseText === "") ? "" : (jQuery.parseJSON(jqXHR.responseText).message) ? 
            jQuery.parseJSON(jqXHR.responseText).message : jQuery.parseJSON(jqXHR.responseText).error.message;
        console.error(errorString);
    });
};

function run() {
    var time = 0;
	$('img:not(.face)').each(function(index, element) {
	//$($('img')[1]).each(function(index, element) {
		setTimeout(function() {
			isFace(element);
		}, time);
		time += 1000;
	});
};

$('img:not(.face)').click(function() {
	isFace(this);
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.type === 'apply') {
    	run();
    } else if (request.type === 'images') {
    	images = request.images;
    }
});