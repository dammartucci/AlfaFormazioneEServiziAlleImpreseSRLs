class SpinnerPicker{
	
	//INITIALIZATION
	
	constructor(navfunction,initialvalue,eventsource){
		this.arraynavigator = navfunction;
		initialvalue = Math.floor(initialvalue*initialvalue/navfunction(Math.floor(initialvalue)));  //attempt to retrieve index for floating point values
		this.index   = (initialvalue==undefined || Number.isNaN(initialvalue))?0:initialvalue;
	    
		if(eventsource)
	        eventsource.addEventListener("valuechange",()=>{
			    try{this.repaint();}
			    catch(typeerror){/*the canvas was not ready for repaint yet*/}
			});
	}

	loadCSSProperties(style){
		this.CSSbackgroundNSup = "#ffffff";    //initialize with default values
		this.CSSbackgroundNSdn = "#ffffff"
		this.CSSbackgroundS    = "#eeeeee";
		this.CSSbackground     = "#ffffff";
		this.CSSselectionColor = "#000000";
		this.CSSfontColor      = "#000000";
		this.CSSfont           = "Arial";
		this.density           = 5;
		this.containsImages    = false;
		//this.halfspin = false;              //activates the wheel half spin property: if not the wheel ticks following the values
	    
		if(style){
			this.CSSbackgroundNSup = style["--background-image-up"] ?? this.CSSbackgroundNSup;
			this.CSSbackgroundNSdn = style["--background-image-dn"] ?? this.CSSbackgroundNSdn;
			this.CSSbackgroundS    = style["--scope-image"]         ?? this.CSSbackgroundS;
			this.CSSbackground     = style["--background"]          ?? this.CSSbackground;
			this.CSSselectionColor = style["--line-color"]          ?? this.CSSselectionColor;
			this.CSSfontColor      = style["--font-color"]          ?? this.CSSfontColor;
			this.CSSfont           = style["--font"]                ?? this.CSSfont;
			this.density           = style["--density"]             ?? this.density;
			this.quality           = style["--quality"]             ?? this.quality;
			
			this.canvas.width      = style["width"].match(/\d/g).join("");  //necessary else default browser value is used
			this.canvas.height     = style["height"].match(/\d/g).join("");
			
		    if(style["--background-image-up"] && style["--background-image-dn"] && style["--scope-image"])
			    this.containsImages = true;
			
			if(this.quality)
				this.increaseCanvasResolution(this.canvas,this.quality);
		}
	
	    this.rows = this.density << 1;
	}
	
	setCanvas(canvas){   
		if(!(canvas instanceof HTMLCanvasElement))   //<canvas> is in fact a bitmap!
            throw "canvas is not an instance of HTMLCanvasElement: "+canvas;
	    this.canvas = canvas;
		this.ctx    = canvas.getContext('2d');
		this.activateListeners(canvas);
	}
	
	increaseCanvasResolution(canvas,val){
        canvas.width  = canvas.width  << val;    //this increases the rendering resolution
        canvas.height = canvas.height << val;
	}
	
	activateListeners(canvas){
		canvas.addEventListener("mousedown",  (e) => this.startDrag(e));
		canvas.addEventListener("mousemove",  (e) => this.drag(e));
		canvas.addEventListener("mouseup",    (e) => this.endDrag(e));
		canvas.addEventListener("mouseleave", (e) => this.endDrag(e));
		
		canvas.addEventListener("touchstart", (e) => this.startDrag(e.touches[0]));
		canvas.addEventListener("touchmove",  (e) => {e.preventDefault(); this.drag(e.touches[0]);});  //this to avoid that interacting with the spinner scrolls the page
		canvas.addEventListener("touchend",   (e) => this.endDrag(e.changedTouches[0]));
	}
	
	//VIEW CONTROLLER METHODS
	
	startDrag(e){
		this.isDragging = true;
	    this.lastY = e.clientY;	
	}
	
	drag(e){
		if (!this.isDragging) return;
		let dy = e.clientY - this.lastY;
		
	    if(Math.abs(dy) > (this.canvas.height >> this.quality)/this.rows){   //quantize the scrolling factor else the spinner is too fast
			this.lastY = e.clientY;
			
			this.index-=Math.sign(dy);     
			//this.halfspin = !this.halfspin;
			this.repaint();
		}
    }
	
	endDrag(e){
		this.isDragging = false;
		//if(this.halfspin) this.halfspin = false;  //avoid to scope two numbers at the same time
		//this.repaint();
	}

    //VIEW (RENDERING) METHODS

    drawLine(ctx, points, lineWidth, lineColor, shadowBlur=null, shadowColor=null) {
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth   = lineWidth;
        ctx.strokeStyle = lineColor;
        if(shadowBlur != null && shadowColor != null) {
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = shadowBlur;
        }
		
        for(let i=0; i<points.length; i++) {
            let x=parseInt(points[i][0] - lineWidth),
                y=parseInt(points[i][1] - lineWidth);
	
            if(i == 0)
                ctx.moveTo(x, y);
            else 
                ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
    }
   
    drawPolygon(ctx, points, color, borderWidth=null, borderColor=null, shadowBlur=null, shadowColor=null) {
        ctx.save();
        ctx.fillStyle = color;
        if(shadowBlur != null && shadowColor != null) {
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur  = shadowBlur;
        }
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for(let i=1; i<points.length; i++) 
            ctx.lineTo(points[i][0], points[i][1]);
        
        ctx.closePath();
        ctx.fill();
        if(borderWidth != null && borderColor != null) {
            ctx.lineWidth   = border.width;
            ctx.strokeStyle = border.color;
            ctx.stroke();
        }
        ctx.restore();
    }
	
	fillPolygon(ctx, points, img, mode = 'stretch') {
		ctx.save();

		// Define the polygon path
		ctx.beginPath();
		ctx.moveTo(points[0][0], points[0][1]);
		for (let i = 1; i < points.length; i++) 
			ctx.lineTo(points[i][0], points[i][1]);
		
		ctx.closePath();

		// Limit drawing to inside the polygon
		ctx.clip();

		// Compute bounding box
		let xs = points.map(p => p[0]);
		let ys = points.map(p => p[1]);
		let minX = Math.min(...xs);
		let minY = Math.min(...ys);
		let width  = Math.max(...xs) - minX;
		let height = Math.max(...ys) - minY;

		if (mode == 'stretch') {
		// Stretch to fit polygon bounds
			ctx.drawImage(img, minX, minY, width, height);
		} 
		else if (mode == 'cover') {
		// Maintain aspect ratio, cover entire area
			let imgRatio = img.width / img.height;
			let boxRatio = width / height;
			let drawWidth, drawHeight;

			if (imgRatio > boxRatio) {
				// Image is wider → crop sides
				drawHeight = height;
				drawWidth  = img.width * (height / img.height);
			} else {
				// Image is taller → crop top/bottom
				drawWidth  = width;
				drawHeight = img.height * (width / img.width);
			}

			let offsetX = minX - (drawWidth - width) / 2;
			let offsetY = minY - (drawHeight - height) / 2;
			ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
		}
		ctx.restore();
	}
    
    repaint() {	
		let width    = this.canvas.width;
		let height   = this.canvas.height;
        let hBoxSize = height / 7;
		let line0y   = hBoxSize * 3;
		let line1y   = hBoxSize * 4;
		let ctx      = this.ctx;
		
		//reset the canvas
        ctx.clearRect(0, 0, width, height);	
		
		//define the bounding boxes of the three rectangles
		let uprect  = [[0,   0   ], [width,   0   ], [width, line0y], [0, line0y]];
		let midrect = [[0, line0y], [width, line0y], [width, line1y], [0, line1y]];
		let lowrect = [[0, line1y], [width, line1y], [width, height], [0, height]];
		
		//draw background, if present. else it's white by default.
		if(this.CSSbackground){
			//fill the three areas: upper values, center value, lower values
			this.drawPolygon(ctx, uprect,  this.CSSbackground);
			this.drawPolygon(ctx, midrect, this.CSSbackground);
			this.drawPolygon(ctx, lowrect, this.CSSbackground);
		}
		
		//draw the contained elements in perspective
		let rows = this.rows;                 //must be even else it loses center alignment with the scope
		let halfRow = this.density;
		let halfHeight = height >> 1;
		let alignmentOffset = height / 100;   //required to center the items rendering relative to the containing frame
		
		//if(this.halfspin) rows = rows - 1;
	
		for (let i=0; i<rows; i++) {
		  let angleY  =  Math.PI * ((i / rows) - 0.5);             // -π/2 to π/2
		  let scaleY  =  Math.cos(angleY);
		  let yScreen = (Math.sin(angleY) + 1) * halfHeight + alignmentOffset;
		  
		  let value = this.arraynavigator(this.index + i - halfRow);
		  if(value == undefined)
			  value = "◊";

		  ctx.save();
		  ctx.translate(0, yScreen);
		  ctx.scale(1, scaleY);
          
		  //cos(arcsin(x)) is a way to render a circumference arc in the angle axis
          //simplifies to sqrt(1-x*x)
		  //let angleX = Math.cos(Math.asin(((i/rows)*0.2*2 - 0.2) * Math.PI));   // - π/5 to π/5
		  
		  let angleX = Math.sqrt(1 - Math.pow((Math.PI * ((i/rows)*0.25*2 - 0.25)),2));  //-π/4 to π/4
		  ctx.font = hBoxSize * angleX  + "px " + this.CSSfont;
		  ctx.fillStyle = this.CSSfontColor;
		  ctx.textAlign = 'center';
		  ctx.textBaseline = 'middle';
		  ctx.fillText(value, width>>1, 0);	 

		  ctx.restore();
		}
		
		this.arraynavigator(this.index); //reposition the navigator on the selected element
		
		//fill the three areas: upper values, center value, lower values
		if(this.containsImages){
			this.fillPolygon(ctx,[[0,   0   ], [width,   0   ], [width, line0y], [0, line0y]], this.CSSbackgroundNSup);
			this.fillPolygon(ctx,[[0, line1y], [width, line1y], [width, height], [0, height]], this.CSSbackgroundNSdn);
			this.fillPolygon(ctx,[[0, line0y], [width, line0y], [width, line1y], [0, line1y]], this.CSSbackgroundS);
		}
		
		//draw containing panel lines
		this.drawLine(ctx,[[0, line0y], [width, line0y]], 1, this.CSSselectionColor);
        this.drawLine(ctx,[[0, line1y], [width, line1y]], 1, this.CSSselectionColor);		
    }
}