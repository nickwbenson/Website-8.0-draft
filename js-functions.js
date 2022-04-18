(function($) {

	//
	// Thanks http://codepen.io/SebL/pen/pcinL
	//


////////////////////////////////////////////////////////////////////////////////////////////////
//// SoundCloud player on 'Releases' page

	// settings
	// var clientId = '853fdb79a14a9ed748ec9fe482e859dd'; // dev ID
	var clientId = 'caXV6J5G0IDTTMYYKLBrtGaZb5GHjv6T'; // actual ID

	// SoundCloud DOM elements
	var scPlayer,
		scPlaying = false,
		scDuration = 0,
		$player     = $('#scplayer'),
		$playbutton = $player.find('.play'),
		$timeline   = $player.find('.timeline'),
		$playhead   = $player.find('.playhead'),
		$scNow      = $player.find('#now'),
		$scDur      = $player.find('#total'),
		trackURL    = $player.find('.sclink a').attr('href');


	var getTrackData = function(data) {

		$player.find('span#now').html('0:00');
		$player.find('span#total').html( msToMinSec(data.duration) );

		SC.stream('/tracks/' + data.id).then(function(player){
			
			$player.removeClass('initialising');

			scPlayer = player;
			scDuration = data.duration;

			scPlayer.on('play', function(e) {
				$player.addClass('playing');
			})
			scPlayer.on('pause', function(e) {
				$player.removeClass('playing');
			})
			scPlayer.on('seek', function(e) { // when seek method is called
			});
			scPlayer.on('time', function(e) { // when playback position is updated
				var msNow = Math.floor(scPlayer.currentTime()),
					per = msNow / scDuration;
				$scNow.html( msToMinSec(msNow) );
				$playhead.width( $timeline.width() * per );
			});
			scPlayer.on('finish', function(e) {
				scPlayer.seek(0); // rewind track to start
				$player.removeClass('playing');
			});
		});
	}


	// only initialise SoundCloud player if it exists in page
	$('#scplayer').each( function($el) {

		// call API's initialize() method
		SC.initialize({ client_id: clientId });

		// extract track data with resolve() endpoint [https://developers.soundcloud.com/docs#resolving]
		SC.resolve(trackURL).then(getTrackData);
	});


	$playbutton.on('click', function(e) {
		e.preventDefault();
		if (scPlaying) {
			scPlaying = false;
			scPlayer.pause();
		} else {
			scPlaying = true;
			scPlayer.play();
		}
	});
	$timeline.on('click', function(e) {
		e.preventDefault();
		var xpos = e.offsetX,
			per = xpos / $(this).width(), // is this really needed?
			seekTime = scDuration * per;
		scPlayer.seek(seekTime);
	});


	function msToMinSec(millis) { // thanks - http://stackoverflow.com/a/21294619
		var minutes = Math.floor(millis / 60000);
		var seconds = ((millis % 60000) / 1000).toFixed(0);
		return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
	}



////////////////////////////////////////////////////////////////////////////////////////////////
//// MixCloud on 'Radio' pages

	// 
	// MixCloud API to get images
	// 
	/*$('article.small.radio').each( function($el) {

		var $this = $(this),
			url = $(this).attr('data-mixcloud'),
			apiurl = 'https://api.mixcloud.com' + url.split('mixcloud.com')[1];
		console.log(apiurl);

		// change
		// https://www.mixcloud.com/diskotopia/92415-bd1982-salience-ep-special/
		// to
		// https://api.mixcloud.com/diskotopia/92415-bd1982-salience-ep-special/
		
		$.getJSON( apiurl, function( data ) {

			// imgurl = data['pictures']['640wx640h'];
			// imgurl = data['pictures']['320wx320h'];
			
			// console.log( apiurl );
			// $this.find('.img img').attr( 'src', imgurl );

			mixcloudThumb( $this.find('.img img'), data );
		});
	});*/

	// 
	// MixCloud embed replacing normal link
	// 
	/*$('#player.mixcloud').each( function($el) {
		var url = $(this).find('a').attr('href'),
			// <iframe width="100%" height="120" src="https://www.mixcloud.com/widget/iframe/?feed='https%3A%2F%2Fwww.mixcloud.com%2Fdiskotopia%2Fdiskotopia-radio-8th-december-2016-w-trevor-jackson%2F'&hide_cover=1&hide_artwork=1&light=1" frameborder="0"></iframe>
			iframeStr = '<iframe width="100%" height="120" src="https://www.mixcloud.com/widget/iframe/?feed=' + url + '&hide_cover=1&hide_artwork=1&light=1" frameborder="0"></iframe>';

		$(this).html( iframeStr );

		// mixcloudAPI( $(this).find('a').attr('href'), mixcloudThumb );
	});*/
	$('a.embed-mc-link').each( function(i) {
		var url = $(this).attr('href'),
			// iframeStr = '<iframe width="100%" height="120" src="https://www.mixcloud.com/widget/iframe/?feed=' + url + '&hide_cover=1&hide_artwork=1&light=1" frameborder="0"></iframe>';
			iframeStr = '<iframe width="100%" height="120" src="https://www.mixcloud.com/widget/iframe/?feed=' + url + '&hide_cover=1&hide_artwork=1" frameborder="0"></iframe>';
		// $('#embed-mc').html( iframeStr ).removeClass('loading');
		$('#embed-mc').html( iframeStr );
	});

	function mixcloudThumb( $el, data ) {
		var imgurl = data['pictures']['320wx320h']; // ['640wx640h']
		$el.attr( 'src', imgurl );
	}




////////////////////////////////////////////////////////////////////////////////////////////////
//// Videos on 'Releases' page
	
	var $vidparent = $('#vid'),
		$vidtarget = $('#vidtarget'),
		vidData = {}, // to hold the video(s) meta data indexed by ID - **currently unused**
		youtubeFrame, // keep here in case YouTube iframe fappery is required
		vimeoControl; // keep here in case Vimeo.Player() is invoked

	
	// embedding YouTube and Vimeo with iframes
	function videoEmbed($el, id, provider, title, link) {

		var src = '',
			iframeStr = '',
			provider = provider.toLowerCase(); // force lowercase for if statements below

		// customise iframe src with provider-specific queries (and include JS API access on both)
		if (provider === 'youtube') {
			src = '//www.youtube.com/embed/' + id + '?autoplay=1&color=white&showinfo=0&rel=0&enablejsapi=1';
		}
		if (provider === 'vimeo') {
			src = '//player.vimeo.com/video/' + id + '?autoplay=1&color=ffffff&title=false&byline=false&api=1'
		}

		// iframe always has consistent id and attributes, only src changes
		iframeStr = '<iframe id="vidembed" src="' + src + '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>'

		// set [id] and [provider] data attributes, replace $el content with new iframe embed
		setDataAttrs( $el, { 'data-id':id, 'data-provider':provider } );
		$el.html( iframeStr );

		// once [iframeStr] is in page, prepare controllers for use on it within videoControl() below
		if (provider === 'youtube') { youtubeFrame = document.getElementById('vidembed').contentWindow }
		if (provider === 'vimeo') { vimeoControl = new Vimeo.Player( $('#vidembed') ) }
	}
	
	// utility - set background of DOM element
	function setBackground($el, imgurl) {
		$el.css('background-image', 'url(' + imgurl + ')');
	}
	
	// utility - set attributes of DOM element
	function setDataAttrs( $el, $dataObj ) { // $dataObj is data object where [key = attr name] and [value = attr value]
		$.each( $dataObj, function(k,v) { $el.attr(k,v) } );
	}

	// Play/Pause videos within embedded iframe using controllers set up in videoEmbed()
	function videoControl(action) { // action = 'pause' | 'play'

		// use vidbox 'provider' attr to detemine control method - YouTube and Vimeo only so far.
		var pr = $vidtarget.attr('data-provider');
		
		if (pr === 'youtube') { // adapted from - http://stackoverflow.com/a/8668741 -- vanilla js is better for cross-frame scripting (http://stackoverflow.com/a/1654262)
			if (action === 'pause') {
				youtubeFrame.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
			} else if (action === 'play') {
				youtubeFrame.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
			}
		}
		if (pr === 'vimeo') { // simpler than YouTube but requires extra API load in parent document -- https://developer.vimeo.com/player -- https://github.com/vimeo/player.js
			if (action === 'pause') {
				vimeoControl.pause();
			} else if (action === 'play') {
				vimeoControl.play();
			}
		}
	}

	// process video links - supports YouTube and Vimeo, maybe others?
	$('.vidlink a').each( function() {

		var $this = $(this),
			url = this.href;

		// call NOEMBED to retrieve video metadata - found via: http://stackoverflow.com/a/32190892
		$.getJSON( 'https://noembed.com/embed', { format:'json', url:url },
			function( data ) {

				// this link is dead
				if (data.error) {
					if ( $this.parent().siblings().size() == 0 ) {
						$this.closest('.col').remove(); // if there are no others, delete the whole thing
					} else {
						$this.parent().remove(); // otherwise, just delete this link
					}
				} else {
					// set basics
					id = data.video_id;
					thumburl = data.thumbnail_url;

					// override basics for YouTube
					if ( data.provider_name.toLowerCase() === 'youtube' ) {
						id = url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/)[1]; // extract youtube vid id - thanks -- http://stackoverflow.com/a/10591582
						thumburl = 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg' // YouTube thumbnail sizes: default | mqdefault | sddefault | hqdefault | maxresdefault
					}

					// set link background image and data attributes
					setBackground( $this, thumburl );
					setDataAttrs( $this, { 'title':data.title, 'data-id':id, 'data-provider':data.provider_name } )

					// save video data to object with ID as key
					vidData[id] = data;
				}
			}
		).error( function( data ) {
			console.log(data);
		});
	});

	$('.vidlink a').on('click', function(e) {
		e.preventDefault();

		var id = $(this).attr('data-id'), // each <a> tag will have yt ID set by $('.vidlink a').each()
			pr = $(this).attr('data-provider'),
			ti = $(this).attr('title'),
			li = $(this).attr('href');

		// remove ALL playing and hidden classes on vid links
		$('.vidlink').removeClass('hidden playing');

		if ($vidtarget.attr('data-id') === id) {
			if ($vidparent.hasClass('visible')) {
				$vidparent.removeClass('visible'); // if it's visible, hide frame and pause video
				$(this).parent().addClass('hidden'); // toggle this link's play state
				videoControl('pause'); // pause playback
			} else {
				$vidparent.addClass('visible'); // if it's hidden, show frame and play video
				$(this).parent().addClass('playing'); // toggle this link's play state
				videoControl('play'); // restart playback
			}
		} else {

			// either a) nothing loaded or b) different video loaded
			$vidparent.addClass('visible'); // show vidframe player
			$(this).parent().addClass('playing'); // toggle this link's play state
			videoEmbed( $vidtarget, id, pr, ti, li); // embed new video in vidbox
		}
	});
	// $('#vidclose').on('click', function(e) {
	// 	e.preventDefault();
	// 	$vidparent.removeClass('visible'); // hide vidframe player
	// 	$('.vidlink.playing').removeClass('playing').addClass('hidden'); // toggle active link's play state
	// 	videoControl('pause'); // pause playback
	// });
	


	// $('.thumb').on('click', function(e){
	// 	e.preventDefault();
		
	// })
	// $('#thumbs a').each(function(i){
	// 	var $this = $(this),
	// 		url = $(this).attr('href'),
	// 		hasThumbs = !$this.parent().hasClass('displaynone');

	// 	console.log(i + ' ' + hasThumbs);

	// 	$.getJSON( 'https://noembed.com/embed', { format:'json', url:url },
	// 		function( data ) {

	// 			console.log(data);

	// 			// this link is dead
	// 			if (data.error) {
					
	// 			} else {
	// 				// set basics
	// 				id = data.video_id;
	// 				thumburl = data.thumbnail_url;

	// 				console.log( thumburl );

	// 				// override basics for YouTube
	// 				if ( data.provider_name.toLowerCase() === 'youtube' ) {
	// 					id = url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/)[1]; // extract youtube vid id - thanks -- http://stackoverflow.com/a/10591582
	// 					thumburl = 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg' // YouTube thumbnail sizes: default | mqdefault | sddefault | hqdefault | maxresdefault
	// 				}

	// 				$this.css('background-image', 'url(\"' + thumburl + '\")');
	// 				// $this.css('background-color', '#333');
	// 				// set link background image and data attributes
	// 				// setBackground( $(this), thumburl );
	// 				setDataAttrs( $(this), { 'title':data.title, 'data-id':id, 'data-provider':data.provider_name } )
	// 			}
	// 		}
	// 	).error( function( data ) {
	// 		// console.log(data);
	// 	});
	// });

	$('#media div.vid').each(function(i){
		var $this = $(this),
			$anchor = $this.find('a'),
			url = $anchor.attr('href'),
			title = $anchor.attr('title');

		// console.log(title + ' : ' + url);

		$.getJSON( 'https://noembed.com/embed', { format:'json', url:url },
			function( data ) {

				// console.log(data);

				
				if (data.error) { // noembed says this link is dead
					$this.addClass('dead');
				} else {
					$this.addClass('alive');

					var id = data.video_id,
						thumburl = data.thumbnail_url,
						provider = data.provider_name.toLowerCase(),
						title_ne = data.title;

					// console.log( thumburl );

					// override basics for YouTube
					if ( provider === 'youtube' ) {
						id = url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/)[1]; // extract youtube vid id - thanks -- http://stackoverflow.com/a/10591582
						thumburl = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg' // YouTube thumbnail sizes: default | mqdefault | sddefault | hqdefault | maxresdefault
					}
					$anchor
						.css('background-image', 'url(\"' + thumburl + '\")')
						.attr( { 'title':title_ne } )
						.parent().attr( { 'title':title_ne, 'data-id':id, 'data-provider':provider } );
				}
			}
		).error( function( data ) {
			$this.addClass('dead');
		});
	});
	$('#media .vid a').on('click', function(e){

		var $me = $(this).parent();
		if ( $me.hasClass('alive') ) {
			e.preventDefault();
			videoSelfEmbed($me);
		}

		// console.log( $(this).attr('href') );
	});

	function videoSelfEmbed($el) {

		var id = $el.attr('data-id'),
			provider = $el.attr('data-provider'),
			src = '',
			iframeStr = '';

		// console.log(id);

		// customise iframe src with provider-specific queries (and include JS API access on both)
		if (provider === 'youtube') {
			src = '//www.youtube.com/embed/' + id + '?autoplay=1&color=white&showinfo=0&rel=0&enablejsapi=1';
		}
		if (provider === 'vimeo') {
			src = '//player.vimeo.com/video/' + id + '?autoplay=1&color=ffffff&title=false&byline=false&api=1'
		}

		// iframe always has consistent id and attributes, only src changes
		iframeStr = '<iframe class="vidembed" src="' + src + '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>'

		// set .played class, replace $el content with new iframe embed
		$el.addClass('played').html( iframeStr );
	}


////////////////////////////////////////////////////////////////////////////////////////////////
//// Email defuscation

	$('a.defusc').each( function() {
		var atmark = $('body').attr('data-at'),
			str = $(this).attr('href')
					.replace('mailto:', '')
					.replace(atmark, '@');
		$(this).attr('href', 'mailto:' + str ).html(str);
	});


////////////////////////////////////////////////////////////////////////////////////////////////
//// Form handling

	var siteroot = $('body').attr('data-root'),
		formTimer; // used in formThank()


	$('form#mlist, form#contact').on('submit', function(e){
		e.preventDefault();

		 // gotta serialize() here: for some damn reason it doesnt work when form is passed as JQ object to later functions...
		var dataSerial = $(this).serialize();
		
		// do the ajaxing
		submitForm( $(this), dataSerial );

		// $(this).toggleClass('thanks');
	});


	function submitForm( $form, dataSerial ) {

		formDisable($form)

		var actionPage = $form.attr('action'),
			eventName = $form.find('button[type="submit"]').attr('name');

		$.ajax({
			url:siteroot+'/'+actionPage+'/',
			data:dataSerial+'&'+eventName+'=submit',
			dataType:'json', type:'post',
			success:function( json ) {

				// REPLY CAME BACK
				// data = json[0];

				if (json.response === 'error') {
					formErrors( $form, json );
				} else if (json.response === 'success') {
					formThank( $form );
				}

				formEnable($form);
			},
			error:function(json) {

				// REPLY DIDN'T COME BACK or CAME BACK INCORRECTLY FORMATTED
				// console.log('error func');
				console.log('sym page not found or json response incorrectly formatted');
				
				// check valid JSON return - hattip: http://stackoverflow.com/a/12217209
				// var is_json = true;
				// try { var json = $.parseJSON(msg); }
				// catch(err) { is_json = false; }

				// if ( is_json ) {
				// 	console.log('json response incorrectly formatted');
				// } else {
				// 	console.log('xhr page not found');
				// }
				
				formEnable($form);
			}
		});
	}
	function formDisable( $form ) {
		$form.addClass('awaiting')
			.find('input, textarea, button').attr('disabled', 'disabled');
	}
	function formEnable( $form ) {
		$form.removeClass('awaiting')
			.find('input[disabled], textarea[disabled], button[disabled]').removeAttr('disabled', 'disabled');
	}
	function formThank( $form ) {
		$form.addClass('thanks');
		formTimer = setTimeout(function() { formReset($form); clearTimeout(formTimer); }, 2000);
	}
	function formErrors( $form, data ) {

		$form.addClass('errors')
			.find('.error').removeClass('error');

		$.each( data.errors, function(key,val) {
			// console.log(data.errors[i]);
			// console.log(data.errors);
			// console.log(key);
			$form.find('label[for='+key+']').addClass('error');
			// $form.find('#'+key).addClass('error');
			// $form.find('*[name="fields['+key+']"]').addClass('error');
		});
	}
	function formReset( $form ) {
		$form.removeClass('awaiting errors thanks')
		$form.find('input[type="text"], input[type="email"], textarea').removeClass('error').val('');
		$form.find('label').removeClass('error');
	}
	

////// FROM SNAZZY CONTACT FORM

	// var siteroot = $('body').attr('data-root'),
	// 	$form = $('#contact-form'),
	// 	formTimer;

	// function ajaxJSON(pageURL,symEvent) {
	// 	pauseForm();
	// 	$.ajax({
	// 		url:siteroot+'/'+pageURL+'/',
	// 		data:$form.serialize()+'&action['+symEvent+']=submit',
	// 		dataType:'json', type:'post',
	// 		success:function(json) {
	// 			if (json.response === 'error') {
	// 				errorsJSON(json)
	// 			} else if (json.response === 'success') {
	// 				sayThanks();
	// 			}
	// 			unpauseForm();
	// 		},
	// 		error: function () {
	// 			unpauseForm();
	// 		}
	// 	});
	// }
	// function pauseForm() {
	// 	$form.addClass('paused');
	// 	$('.input-wrap input').attr('disabled','disabled');
	// }
	// function unpauseForm() {
	// 	$form.removeClass('paused');
	// 	$('.input-wrap input').removeAttr('disabled');
	// }
	// function sayThanks() {
	// 	$form.addClass('thanks');
	// 	formTimer = setTimeout(function() { resetForm(); clearTimeout(formTimer); }, 2000);
	// }
	// function errorsJSON(json) {
	// 	$form.find('label').removeClass(); // remove field states
	// 	$form.find('label').each(function(){ // set field states
	// 		var labelid = strBetween($(this).attr('for'),'[',']');
	// 		if (json.response === 'error' && json.errors.hasOwnProperty(labelid)) {
	// 			var state = json.errors[labelid];
	// 			$(this).addClass(state).find('.fieldmsg').html(state);
	// 		} else {
	// 			$(this).addClass('ok').find('.fieldmsg').html('');
	// 		}
	// 	});
	// }
	// function resetForm() {
	// 	$form.removeClass('thanks').find('label').removeClass().find('fieldmsg').html('') // remove field states
	// 	$form.find('input[type="text"], input[type="email"], textarea').val(''); // zero inputs
	// 	clearTimeout(formTimer);
	// 	unpauseForm();
	// }
	// $form.submit(function(e){
	// 	e.preventDefault();
	// 	ajaxJSON('contact-json','contact-form-save');
	// });



////////////////////////////////////////////////////////////////////////////////////////////////
//// Adminbar toggle in mobile view

	$('#opendrawer').on('click', function(e) {
		e.preventDefault();
		$('#adminbar').toggleClass('open');
	})



////////////////////////////////////////////////////////////////////////////////////////////////
//// Random HEX (why is this here?)

	// thanks Paul Irish etc [https://www.paulirish.com/2009/random-hex-color-code-snippets/]
	function randomHex() {
		return Math.floor(Math.random()*16777215).toString(16); // 16777215 = ffffff in decimal
	}

})(jQuery);
