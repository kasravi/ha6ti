var canvas,
	c,
	devicePixelRatio,
	container, debounce = 100, mayeNum=0, gusheNum=0,
	sound=[],isPlaying=[],gain=[],octs=[],ctrls=[];
var maye={};
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

var points = [];

function play(i, m, v) {
	v = v < 0 ? 0 : v + 0.01;
	v= i>9?v/3:v;

var f = parseFloat(Math.pow(2,(m-69)/12)*440);

if(ctrls[4].active && i>9) {return}
	if(sound[i] && !isPlaying[i]) {
		var offset = (i>9?Math.random()/20:0);
		
		sound[i].frequency.setValueAtTime(f, audioCtx.currentTime);
		gain[i].gain.setTargetAtTime(v, audioCtx.currentTime + offset, 0.1);
		isPlaying[i]=true;
		
	} else if(sound[i] && isPlaying[i]) {
		gain[i].gain.setTargetAtTime(v, audioCtx.currentTime, 0.2);
	}
}

function stop(i){
	if(isPlaying[i]) {
		gain[i].gain.cancelScheduledValues(audioCtx.currentTime);
		gain[i].gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.1);
		isPlaying[i]=false;
	} 
}

function initsound(){
	//var real = new Float32Array([0,0.4,0.4,1,1,1,0.3,0.7,0.6,0.5,0.9,0.8]);
	var real = new Float32Array([0,0.7,0.1,0.05,0.3]);
	var imag = new Float32Array(real.length);
	var hornTable = audioCtx.createPeriodicWave(real, imag);
	for(let i = 0 ; i< 13; i++) {
		sound[i] = audioCtx.createOscillator();
		gain[i] = audioCtx.createGain();
		gain[i].gain.value = 0; 
		gain[i].connect(audioCtx.destination);
		sound[i].connect(gain[i]);
		//sound[i].type = 'sine';
		sound[i].setPeriodicWave(hornTable);
		sound[i].start();
		
		isPlaying[i]=false;
	}
	
}

function draw() {
	var radius;
	if(canvas.height != window.innerHeight * devicePixelRatio) {
		resetCanvas();
	} else {
		c.clearRect(0,0,canvas.width, canvas.height);
	}
	c.strokeStyle = "#eee";
	c.lineWidth = "10";

	
}

function positionHandler(e) {
	// stop scrolling etc
	e.preventDefault();

	if ((e.type == 'mousemove') || (e.type == 'mouseout')) {
		// remove previous mouse entry from the array (assumes only a single mouse is ever present)
		for (var i = 0, l = points.length; i<l; i++) {
			if (points[i].type == 'mousemove') {
				points.splice(i,1);
			}
		}
		if (e.type == 'mousemove') {
			// add new mouse event entry
			points.push(e);
		}
	} else if ((e.type == 'touchstart')||(e.type == 'touchmove')||(e.type == 'touchend')||(e.type == 'touchcancel')) {
		// remove any points except for mouse (to allow possibility of simultaneous mouse and touch - Chromebook Pixel?)
		for (var i = 0, l = points.length; i<l; i++) {
			if (points[i].type != 'mousemove') {
				points.splice(i,1);
				i--;
				l--;
			}
		}
		// add in all entries from the array-like targetTouches
		for (var i = 0, l = e.targetTouches.length; i<l; i++) {
			points.push(e.targetTouches[i]);
		}
		// prevent mouse compat events
		e.preventDefault();
	} else {
		switch (e.type) {
			case 'pointerdown':
			case 'pointermove':
			case 'MSPointerDown':
			case 'MSPointerMove':
				for (var i = 0, found = false, l = points.length; i<l; i++) {
					if (points[i].pointerId == e.pointerId) {
						points[i] = e;
						found = true;
						break;
					}
				}
				if (!found) {
					points.push(e);
				}
				break;
			case 'pointerup':
			case 'pointerout':
			case 'pointercancel':
			case 'MSPointerUp':
			case 'MSPointerOut':
			case 'MSPointerCancel':
				for (var i = 0, l = points.length; i<l; i++) {
					if (points[i].pointerId == e.pointerId) {
                        var o = findOctByFinger(i);
                        if(o){
                            o.el.className = o.el.className.replace("active", "inactive");
                            o.finger = -1;
                        }
						stop(points[i].pointerId%10);
						stop(10);
						stop(11);
						stop(12);
						
						
						o = findOct(points[i],ctrls);
						var d = new Date()
						if( o && o.ready && d.getTime()-o.time>debounce)
						{
							o.ready=false;
							o.active = !o.active;
							o.el.className = o.active ? o.el.className.replace("inactive", "active"):
										o.el.className.replace("active", "inactive");
						} else {
							for(var n= 0; n<5; n++){
								ctrls[n].ready = false;
							}

						}

						points.splice(i,1);
						break;
					} 
				}
				break;
		}
    }
    for (var i = 0, l = points.length; i<l; i++) {
		if (typeof(points[i].pressure) != 'undefined' && points[i].pressure != null) {
			radius = 35 + (points[i].pressure * 25);
		} else if (typeof(points[i].force) != 'undefined' && points[i].force != null) {
			radius = 35 + (points[i].force * 25);
		} else if (typeof(points[i].webkitForce) != 'undefined' && points[i].webkitForce != null) {
			radius = 35 + (points[i].webkitForce * 25);
		} else {
			radius = 50;
		}
		var v = ((radius/85)-0.6)*3;
        var o = findOct(points[i],octs);
        if(o){
			o.el.className = o.el.className.replace("inactive", "active");
            o.finger = i;
			var freq = maye.dangs[o.dang-1][o.note-1];
			var idx = maye.variations.indexOf(freq);
			if(idx>-1 && ctrls[parseInt(idx/2)].active){
				freq = maye.variations[idx+1];
			}
			play(points[i].pointerId%10,freq,v);
			play(10,freq < maye.kook[3] ? maye.kook[3]: maye.kook[2],v);
			play(11,maye.kook[1],v);
			play(12,maye.kook[0],v);
		} else{
			o = findOct(points[i],ctrls);
			var d = new Date()
			if( o && d.getTime()-o.time>debounce)
			{
				o.time = d.getTime();
				o.ready=true;
			}
		}
	}
	window.requestAnimationFrame(draw);
}

function init() {
	initsound();
	canvas = document.createElement( 'canvas' );
	c = canvas.getContext( '2d' );
	container = document.getElementById('all');
	container.className = "container";
	resetCanvas();
	container.insertBefore(canvas,document.getElementById('first'));
	/* feature detect - in this case not dangerous, as pointer is not exclusively touch */
	var events = [];
	if ((window.PointerEvent)||(window.navigator.pointerEnabled)||(window.navigator.msPointerEnabled)) {
		events = ['pointerover', 'pointerdown', 'pointermove', 'pointerup', 'pointerout', 'pointercancel',
		          'MSPointerOver', 'MSPointerDown', 'MSPointerMove', 'MSPointerUp', 'MSPointerOut', 'MSPointerCancel'];
	} else {
		events = ['mouseover', 'mousedown', 'mousemove', 'mouseup', 'mouseout',
		          'touchstart', 'touchmove', 'touchend', 'touchcancel'];
	}
	for (var i=0, l=events.length; i<l; i++) {
		canvas.addEventListener(events[i],  positionHandler, false );
	}
	// suppress context menu
	canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); }, false)
	for(var d = 1; d< 4;d++){
		for(var n= 1; n<5; n++){
			octs.push({
				dang:d,
				note:n,
                rect: document.getElementById('o'+d+''+n).getBoundingClientRect(),
                el: document.getElementById('o'+d+''+n),
                finger: -1
			})
		}
	}

	document.addEventListener('swiped-left', function(e) {
		mayeNum++;
		if(mayeNum>mayes.length) {mayeNum = mayes.length-1;}
		maye = mayes[gusheNum][mayeNum];
	});
	document.addEventListener('swiped-right', function(e) {
		mayeNum--;
		if(mayeNum<0) {mayeNum = 0;}
		maye = mayes[gusheNum][mayeNum];
	});
	document.addEventListener('swiped-up', function(e) {
		console.log(e.target); // element that was swiped
	});
	document.addEventListener('swiped-down', function(e) {
		console.log(e.target); // element that was swiped
	});


	var d = new Date()
			
	for(var n= 1; n<6; n++){
		ctrls.push({
			ctrl:n,
			time: d.getTime(),
			ready: false,
			active: false,
			rect: document.getElementById('c'+n).getBoundingClientRect(),
			el: document.getElementById('c'+n),
		})
	}
	maye = mayes[gusheNum][mayeNum];
}

function findOct(point,container) {
	for(oct of container){
		if(point.clientX < oct.rect.right &&
		point.clientX > oct.rect.left &&
		point.clientY > oct.rect.top &&
		point.clientY < oct.rect.bottom)
		return oct;
	}
}

function findOctByFinger(finger) {
	for(oct of octs){
		if(oct.finger === finger)
		return oct;
	}
}

function resetCanvas() {
    // HiDPI canvas adapted from http://www.html5rocks.com/en/tutorials/canvas/hidpi/
	devicePixelRatio = window.devicePixelRatio || 1;
	canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    c.scale(devicePixelRatio, devicePixelRatio);
}

window.addEventListener('load',function() {
	setTimeout(init,100);
},false);