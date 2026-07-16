//here the scripts to manipulate the DOM graphic elements. Shared by every webpage, it's loaded one time.
//someone may wonder why to do this, while i could actually create a script type="module". I tried, and I was 
//blocked by the browser's CORS policy, that i was not able to disable for offline testing. 
// - I could run a local server, but i refused to do that. 
// - I could run a browser instance without CORS, but at that time I didn't think was possible. 
//After undoing all the changes, like the export classes of the model, finally 
//I came up with this class. Maybe this outcome has turned better than the original idea.
//I added the dynamic generation of main menu and footer note for the same reason i created the other functions:
//avoiding to manually update every item in case i change something. This js injection is more than justified to me.
//the beginning and the end of each page is constant. No reason to repeat html code.

//THE AREA CONTAINING CONSTANT VALUES: EDIT AS YOU NEED-----------------------------

const BUSINESS_NAME = "Alfa Formazione & Servizi alle Imprese";
const FOOTER_NOTE_C = "srls - tutti i diritti riservati";
const FOOTER_NOTE_T = "Seguici sui social e diffondi la voce!";
const FOUNDING_YEAR = "2023";

/*Principle is simple: patches to abide to local laws should be written in the native language.  
  It makes no sense to force awkward English translations.*/
 
//aggiungere tali informazioni è fondamentale per evitare sanzioni fino a 2k EUR

const ITALIAN_CODICE_CIVILE_ART_2250 = {

	"codiceFiscale" : "Codice fiscale: 17470221007",
	"codiceREA"     : ", Codice REA: RM-1720125",
	
	"sedeLegale" : {
		"$name"        : ", Sede legale:",
		"via"          : "via di Grotte Portella",
		"numerocivico" : "12",
		"cap"          : "00044",
		"comune"       : "Frascati",
		"citta"        : "RM"
	},
	
	"capitaleSociale": {
		"$name"          : ", Capitale sociale:",
		"importo"        : "1000 €",
		"statoVersamento": "interamente versato",              //i.v. oppure p.v.
        "tipologiaSoci"  : ""		                           //unipersonale oppure stringa vuota
	}	
};

const LOCATIONS = [
    ["https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2972.4060226374977!2d12.652841311483346!3d41.84108677112588!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1325878f8d2f26db%3A0x2cf9f058135fe1a7!2sVia%20di%20Grotte%20Portella%2C%2012%2C%2000044%20Roma%20RM!5e0!3m2!1sit!2sit!4v1784136205135!5m2!1sit!2sit",
     "Sede I: Frascati RM"],
    ["https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2963.919734000248!2d12.907854511493145!3d42.023454271106054!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x132f9b9b2028be3b%3A0xadd369f179b0d612!2sVia%20Colle%20Cappellino%2C%2059%2C%2000020%20Colle%20Cappellino%20RM!5e0!3m2!1sit!2sit!4v1784136308808!5m2!1sit!2sit",
	 "Sede II: 59A, Mandela RM"]
];
	
const SOCIAL_NETWORKS_CONTACTS = [
    ["https://facebook.com/","facebook.webp"],
	["https://instagram.com/","instagram.webp"],
	["https://whatsapp.com/","whatsapp.webp"]
];


const MENU_BUTTONS = [
    [BUSINESS_NAME,"menu-main-button","main.html"],              //PLEASE SKIP THIS ENTRY
    
	["Servizi","services-button","main.html#services"],
    ["Chi siamo","about-us-button","main.html#about-us"],
	["Contatti","contact-us-button","main.html#contact-us"],
	["Storia","history-button","not-available.html"]             
];                                                               //ADD AS MANY ENTRIES AS YOU NEED
//---------------------------------------------------------------------------------

class GraphicElementsEnabler{
	
	constructor(){
		document.addEventListener("DOMContentLoaded",() => {
			//available on all documents: STATIC
			this.createMainMenu(BUSINESS_NAME,MENU_BUTTONS);                                      
			this.enableLinkButtons(MENU_BUTTONS);
			this.enableMainMenuJollyButton();     
			this.createFooterNote(SOCIAL_NETWORKS_CONTACTS); 	
			
			
		    //available only in some documents: elements with specific ids are searched and manipulated: STATIC        
			this.createEnableForm("inserts-form-here");                 
			this.createEnableGoogleMapsFrame("inserts-gmaps-frame-here",LOCATIONS);
			this.enableReserveSpotButton("goto-payment-info"); 
			
			
			//available in mostly all documents: new items may be added DYNAMICALLY
			//previously created elements may use these classes, so now it's time to enable them 		
			this.mutobserver = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
					//console.log(mutation);
					mutation.addedNodes.forEach(node => {
						if (node.nodeType === Node.ELEMENT_NODE) {        
							this.enableInteractiveElements(node);        //apply only where needed
						}
					});
				});
			});
			this.mutobserver.observe(document.body, { childList: true, subtree: true });
			
			this.intobserver = new IntersectionObserver((entries,observer) => {
				for(let i=0;i<entries.length;i++)
					if(entries[i].isIntersecting){
						entries[i].target.classList.toggle("observed");
						observer.unobserve(entries[i].target);          //once you have observed the object, stop observing it
					}
			}, {threshold:0.3});    //action is triggered if the minimum percentage of visibility of the area, where the item is located inside the document, is reached
			
		    this.enableInteractiveElements(document);
		});   	
	}
	
	enableInteractiveElements(node){
		if(node != document)        //FUNDAMENTAL!! THE QUERYSELECTORALL CAN'T SELECT THE NODE IT'S INVOKED ON
		    node = node.parentElement;
		
		this.processNodeDirectChildren(node,".spawn-element","listener_spawnelem",this.enableElementsSpawning.bind(this));
		
		this.processNodeDirectChildren(node,".expandable-container",       "listener_expcont",      this.enableExpandableContainerExpandCollapseTextPreview);
        this.processNodeDirectChildren(node,".extractable",                "listener_extractables", this.enableExtractablesFromLayout);		
		this.processNodeDirectChildren(node,".togglable,.togglable-button","listener_togglables",   this.enableTogglables);
		this.processNodeDirectChildren(node,".togglables-xor-container",   "listener_togglxorcont", this.enableTogglablesContainer);
		this.processNodeDirectChildren(node,".browsable-container",        "listener_browsabcont",  this.enableBrowsableContainer);
		this.processNodeDirectChildren(node,".parallax-container",         "listener_parallaxcont", this.enableParallaxContainer);
		this.processNodeDirectChildren(node,".copyable",                   "listener_copyable",     this.enableCopyable.bind(this));
	
	    this.processNodeDirectChildren(node,".image-background",           "processed_imgbackgr", this.addImageBackground);
	}
	processNodeDirectChildren(node,selector,listenerPropertyName,method){
	    let elems = node.querySelectorAll(selector);
		for(let i=0;i<elems.length;i++)
            if(elems[i].dataset[listenerPropertyName] == undefined){ //ensures that a listener is added once, to avoid			
	            method(elems[i]);                                    //double same listener issues (not responding to events)
				elems[i].dataset[listenerPropertyName] = "1";        //put something, like 1 (true)
		    }		
	}
	
	//ENABLE DYNAMIC PRESENTATION OF CONTENTS
	enableElementsSpawning(elem){
		this.intobserver.observe(elem);
	}
	
	//HANDLE THE EXPANDABLE-CONTAINER EXPANSION/COLLAPSE
	//HANDLE THE TEXT PREVIEW GENERATION FOR OBJECTS BELONGING TO EXPANDABLE-CONTAINER-PREVIEW CLASS, 
	//that i consider an extension (in java sense) of expandable-container. 
	enableExpandableContainerExpandCollapseTextPreview(elem){	
		elem.querySelector(".expandable-container-title").addEventListener("click", () =>   //IMPORTANT! ELSE CLICKING INSIDE THE expandable-container TRIGGERS CLOSE
			{elem.classList.toggle("expandable-clicked");}
		);
		
		if(elem.classList.contains("text-preview")){
			let text = elem.querySelector(".expandable-container-content").querySelector("text").innerHTML.substring(0,100)+"...";  //html indentation can introduce these unwanted characters
			let p    = document.createElement("p");           //create a paragraph to include the preview text
			p.textContent = text;
			p.classList.add("add-min-vert-spacing");
			
			let title = elem.querySelector(".expandable-container-title");	
			title.appendChild(p);			
			title.addEventListener("click", () => {
				p.classList.toggle("hide");
			});
		}
	}
	
	//layout managers like Bootstrap don't take into account the fact that a node can change its size.
	//so once a click happens in the node with this class, it's removed from the grid, then, after another
	//click, it's reinserted.
	enableExtractablesFromLayout(elem){    	
		let originalClassList = [];    //copy each value of the original list excepting the specific one
		for(let i=0;i<elem.classList.length;i++)
			if(elem.classList[i] != "extractable")
				originalClassList.push(elem.classList[i]);
		
		let clicked = true;
		elem.querySelector(".extractable-title").addEventListener("click", () => {  //if not using this class, every time you click into the entire element, the listener is triggered
			if(clicked){
				clicked = false;
				for(let i=0;i<originalClassList.length;i++)
					elem.classList.remove(originalClassList[i]);
				elem.style.width = getComputedStyle(elem.parentElement).width;      //this because to successfully extract it from the layout 
			}                                                                       //it must have a high width
			else{
				clicked = true;
				for(let i=0;i<originalClassList.length;i++)
					elem.classList.add(originalClassList[i]);
				elem.style.width = "";
			}
			
			elem.scrollIntoView({ //compensate possible unexpected repositioning of the item by centering the view on it- i know, i should do better than this but should be enough
				behavior: "smooth",   // smooth scrolling
				block:    "center",   // center vertically
				inline:   "center"    // center horizontally (if horizontal scroll)
			});
		});
	}
	
	
	//ENABLES THE ITEMS THAT MAINTAIN THEIR STATE ONCE CLICKED ON
	//it is possible to trigger a click action associated to a particular element only  
	//in case the click is not intercepted by any child but lands only on the element
	enableTogglables(elem){	
        let child = elem.querySelector(".togglable-enabler");   //the class specifies if the property 
		if(child)                                               //can be controlled by the first of its direct children
			child.addEventListener("click",()=>{
				elem.classList.toggle("togglable-clicked");
		    });
	
		elem.addEventListener("click",function(event){           
			if(elem.classList.contains("togglable-on-sides")){  //the class specifies if the property is
			    if(event.currentTarget === event.target)        //triggered if clicking on the element
			        elem.classList.toggle("togglable-clicked"); //itself XOR on its borders
			}
		    else
				if(!child)
				    elem.classList.toggle("togglable-clicked");
		});		
	}
	enableTogglablesContainer(elem){
		let lastClicked = undefined;
		elem.addEventListener("click",()=>{
			let children = elem.querySelectorAll(".togglable,.togglable-button");
			if(lastClicked === undefined)
				for(let j=0;j<children.length;j++){
					if(children[j].classList.contains("togglable-clicked")){
						lastClicked = children[j];
						break;
					}
				}
			else
				for(let j=0;j<children.length;j++){
					if(children[j].classList.contains("togglable-clicked"))
						if(children[j] != lastClicked){
							lastClicked.classList.toggle("togglable-clicked",false);    //avoiding that click on the previous button doesn't reactivate it if clicking on another button
							lastClicked = children[j];
						}
				}											
		});
	}
	
	enableBrowsableContainer(elem){
		let browsables = elem.querySelectorAll(".browsables");
		
		let lengths = [];
		for(let j=0;j<browsables.length;j++)
			lengths.push(browsables[j].children.length);
		let length = Math.max(...lengths);
		
		if(length < 2) return;                   // trivial case: 1 or 0 elements
		
		let x = -1;
		let y = 0;
		let cycleValues = (bool) => {
			if(bool) x++;                        // the if-else implementation is lighter than module calc
			else     x--;
		
			if(x>=0){
				if(x>=length)  x = 0;      
				y = x;                         // y = x % values.length;
			}else{
				if(x<-length) x = -1;
				y = x + length;                // y = (x + 1) % values.length + (values.length - 1)
			}			
		};

		let cycleBrowsables = (bool) =>{
			cycleValues(bool);	
			
			for(let j=0;j<browsables.length;j++)
				if(y < lengths[j]){
					for(let k=0;k<lengths[j];k++)
						browsables[j].children[k].classList.toggle("hide",true);
					browsables[j].children[y].classList.toggle("hide",false);
				}
		};
		cycleBrowsables(true);                       //invoke one time to initialize
		
		let prevButton = document.createElement("button");
		let nextButton = document.createElement("button");
		
		prevButton.innerHTML = `<<`;
		nextButton.innerHTML = `>>`;
		
		prevButton.addEventListener("click",function(event){event.stopPropagation();cycleBrowsables(false);});   //don't allow the event to propagate to parents
		nextButton.addEventListener("click",function(event){event.stopPropagation();cycleBrowsables(true);});	
		
	    if(elem.classList.contains("flex-container")){
		    prevButton.className = "common-menu-button";  //absolute positioning
			nextButton.className = "common-menu-button";
		
			elem.prepend(prevButton);
			elem.appendChild(nextButton);	
		}
		else{
			prevButton.className = "common-menu-button abs-pos-y-mid abs-pos-x-l-side";  //absolute positioning
			nextButton.className = "common-menu-button abs-pos-y-mid abs-pos-x-r-side";
			
			elem.style.position = "relative";  //NECESSARY! else they are located at the beginning of document
			elem.appendChild(prevButton);
			elem.appendChild(nextButton);	
		}
	}
	
	//ENABLE THE PARALLAX EFFECT: MANAGE THE IMAGE SIZES DYNAMICALLY, AND HANDLE THE CASE OF A SCREEN WITH INSUFFICIENT WIDTH
	enableParallaxContainer(parallaxContainer){
			//the parallax can work ONLY if you hardwire the initial height of each image, absolute to the first layer, in the images themselves.
			//if you, like me, think that you can dynamically set the inital vertical height of the images, you will fail.
			//the reason: setting an initial location in pixel will desync one layer from another if the images are resized (and they are)
			
			parallaxContainer.style.height = parseFloat(parallaxContainer.dataset.height_vw) + "vw";  //this works because the method is invoked on DOMContentLoaded
			
			let imgResc = "fluid-element";
			let layers  = parallaxContainer.querySelectorAll("img");
			for(let i=0;i<layers.length;i++){   
				layers[i].classList.add(imgResc);       //the bootstrap property img-fluid property allows to dynamically resize image to not overflow the external bounds. However, if the image is smaller than the bounds, this property does not resize automatically: the image stays at its max size
				layers[i].style.zIndex   = -1;          //necessary to avoid overlap with other elements in the document, that by default have index=0.
				layers[i].style.position = "absolute";  //the condition to correctly stack each image to their initial position: use coordinates of the ancestor element
			}
			
			window.addEventListener("scroll", () => {
				const scrollTop = -window.pageYOffset;  //the amount of scroll
				for(let i=0;i<layers.length;i++){   
					const speed = parseFloat(layers[i].dataset.speed);
					layers[i].style.transform = `translateY(${scrollTop * speed}px)`;
				}
			});
			
			let minWidth = parseFloat(parallaxContainer.dataset.requiresoverflow_width_px);    //the width below which parallax layers stop resizing 
			let okWidth  = parseFloat(parallaxContainer.dataset.canberestored_width_px);       //the width after which parallax layers resume resizing 
			
			if(minWidth <50 && okWidth <50) return;
			
		    let b2 = new BoundsWatcher(
				() => document.body.clientWidth <= minWidth,       //window.innerWidth can't be used. see below in the next instance
				() => {
					for(let i=0;i<layers.length;i++){
						layers[i].classList.toggle(imgResc, false);
						layers[i].style.width = okWidth + "px";
					}
				},
				() => document.body.clientWidth >= okWidth,
				() => {
					for(let i=0;i<layers.length;i++){
						layers[i].classList.toggle(imgResc, true);
						layers[i].style.width = "auto";
					}
				}
			);
			
			window.addEventListener("resize",() => b2.handleOverflowItems());
			b2.handleOverflowItems();					
	}
	
	
	enableCopyable(elem){
		elem.addEventListener("click",() => this.copyContents(elem));
	}
	
	copyContents(elem){
		let range = document.createRange();
		range.selectNodeContents(elem);

		let sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);

		document.execCommand("copy");
		
		sel.removeAllRanges(); // cleanup
	}
	
	
	//FUNCTIONS TO HANDLE MAIN MENU NAVIGATION
	
    //0. create the main menu, for easy update and use on all webpages	 
	createMainMenu(businessName,buttons){
        let out = [];
		out.push(`
		    <div class="flex-container">
			    <img class="logo" src="assets/images/logo.webp">
	            <button id="menu-main-button" class="common-button camouflaged">${businessName}</button>
			</div>
			<div id="menu-items">`);
		
		for(let i=1;i<buttons.length;i++)
		    out.push(`\n<button id="${buttons[i][1]}" class="common-container common-menu-button">${buttons[i][0]}</button>`);
				
		out.push(`
		    </div>
		    <!-- the element used to collect overflowing items from the menu -->
		    <div id="overflow-container" class="common-overlaid-container common-menu main-menu-overflow-list-pos" hidden="true"></div>
		    <!-- the button, always appended at the end -->
		    <button id="jolly-button" class="common-container common-button put-on-right-side"></button>`);
	
		let menu = document.createElement("div");
		menu.id  = "main-menu";
	    menu.className = "common-overlaid-container common-menu main-menu-pos spawn-element";   //className overwrites the classList array
		menu.innerHTML = out.join("");
		document.body.prepend(menu);		
	}
	 
	//1. associate buttons to their correspondant functions
	enableLinkButtons(values){
		for(let i=0;i<values.length;i++)
		    document.getElementById(values[i][1]).addEventListener("click",() =>
			    {window.location.href=values[i][2];}
		    );
	}

	//2. manage separately the 'jolly-button' and dynamic menu resizing
	enableMainMenuJollyButton(){
		let documentStyles = getComputedStyle(document.documentElement);
		let criticalWidth  = parseInt(documentStyles.getPropertyValue("--menu-requires-overflow-list").trim());
		let okMinimumWidth = parseInt(documentStyles.getPropertyValue("--menu-can-be-restored-properly").trim());
	   
		let overflowContainer = document.getElementById("overflow-container");
		let jollyButton = document.getElementById("jolly-button");
		let menuItems   = document.getElementById("menu-items");
		let menuParent  = menuItems.parentElement;	
		
		jollyButton.addEventListener("click",() =>{});  //initialize the click listener
		
		let b = new BoundsWatcher(
			() => document.body.clientWidth <= criticalWidth,    //can't use window.innerWidth, since for some reason on mobile devices when document is loaded window size is different from the real one
			() => { 
			        menuParent.removeChild(menuItems);
					overflowContainer.appendChild(menuItems);
					//assign jolly-button expand-collapse function
					jollyButton.innerHTML = "☰";
					jollyButton.onclick = () =>{overflowContainer.hidden = !overflowContainer.hidden;};  
				  },
			() => document.body.clientWidth >= okMinimumWidth,
			() => {
					try{
						overflowContainer.hidden = true;                  //the first time the second one it will throw an exception.	                  
						overflowContainer.removeChild(menuItems);         //that's fine, cause on the first time 
						menuParent.insertBefore(menuItems,jollyButton);   //these instructions don't need to be executed 
					}catch(DOMException){/*console.log(DOMException);*/}
					                                                        //insertBefore must be specified, else the menuItems is appended AFTER the jollyButton
					//assign jolly-button home function
					jollyButton.innerHTML = "Home";
					jollyButton.onclick = () =>{window.location.href="main.html";};
				  }	
		);
		
		window.addEventListener("resize", () => b.handleOverflowItems());
		b.handleOverflowItems();      //run once to initialize the jolly-button
	}
	
	//CREATE THE FOOTER NOTE, FOR EASY UPDATE AND USE ON ALL WEBPAGES	
	createFooterNote(socials){
		let out = [`<h2>${FOOTER_NOTE_T}</h2><div class="thumbnail add-hig-vert-spacing">`];
		for(let i=0;i<socials.length;i++)
			out.push(`\n<a href="${socials[i][0]} target="_blank"><img src="assets/images/social/${socials[i][1]}"></img></a> `);	    
        out.push(`</div><p class="add-min-vert-spacing">COPYRIGHT © ${FOUNDING_YEAR}-${new Date().getFullYear()} - ${BUSINESS_NAME} ${FOOTER_NOTE_C}</p>`);	
        out.push(`<i>${new DataStructureUtilities().translateStructureIntoString(ITALIAN_CODICE_CIVILE_ART_2250," ")}</i>`);
		
        let footerNote = document.createElement("div");
		footerNote.id = "footer-note";
	    footerNote.className = "common-container";
		footerNote.innerHTML = out.join("");	
		document.body.appendChild(footerNote);
	}

	//HANDLE LOCATION SWITCHING ON GOOGLE MAPS IFRAME
	createEnableGoogleMapsFrame(id,values){
		let item = document.getElementById(id);
		if(!item) return;
		
		item.classList.add("browsable-container");
	    let out = [`<div class="browsables">`];
		
		for(let i=0;i<values.length;i++)
	        out.push(`\n<iframe id="locations" class="common-iframe fluid-square-element" src="${values[i][0]}" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`);
			    
		out.push(`</div><div class="browsables">`);
		for(let i=0;i<values.length;i++)
		    out.push(`\n<p class="add-low-vert-spacing">${values[i][1]}</p>`);
				
		out.push(`</div>`);
		
		item.innerHTML = out.join("");
	}
	
	//SINCE THIS ITEM IS REUSED ACROSS PAGES, IT HAS BEEN EDITED AS PROCEDURALLY GENERATED
	createEnableForm(id){
		let item = document.getElementById(id);
		if(!item) return;
		
		item.innerHTML = `
		    <form id="contact-form">
			    <input class="common-overlaid-container add-min-vert-spacing form-control" name="name" type="text" placeholder="Nome" required>
				<input class="common-overlaid-container add-min-vert-spacing form-control" name="surname" type="text" placeholder="Cognome" required>
				<input class="common-overlaid-container add-min-vert-spacing form-control" name="email" type="email" placeholder="e-mail" required>
				<textarea class="common-overlaid-container add-min-vert-spacing form-control" name="message" rows="6" placeholder="Inserisci messaggio..." required></textarea>
				<input class="common-container common-button add-med-vert-spacing" name="" type="submit" value="Invia">
				<!-- the only way for the attribute "required" to work is to use input type="submit" instead of a simple button. -->
			</form>
		`;
	
	    item.children[0].addEventListener("submit", async(event) =>{
			event.preventDefault();  //the default action is to empty all the inputs-->
			let submitter = new FormSubmitter(item.children[0]);
			let outputstr = await submitter.submit();
			alert(outputstr[0]);
			if(outputstr[1])
			    item.querySelector(`[name="message"]`).value+=outputstr[1];
			
			item.querySelector(`[type="submit"]`).value="Inviato!";
		});
	}
	
	enableReserveSpotButton(id){
		let butt = document.getElementById(id);
		if(!butt) return;
		
		butt.addEventListener("click",()=>{
			window.location.href = "payment-info.html";
		});
	}
	
	addImageBackground(elem){
		elem.style.backgroundImage=`url(${elem.dataset.image})`;
	}
	
	
	//use px as units: min and max are pixel size of a sample item when there's a default screen size, or 
	//a big screen size. can be used to calculate var(--scale), used to scale everything in the styling rules.
    //this because contents in pixels is altered in size having high screen resolutions.
	//in css root, insert --scale = calc(avw + brem); then scale everything with clamp(min,var(--scale),100rem);
	//in this way can one achieve neutrality from zoom, like delta neutral options strategies!
	calculateAandBcssStylingCoefficients(min,max, width_min,width_max){
		let a = 100 * (max - min) / (width_max - width_min);
        let b = min - a * (width_min / 100);
		
		return [a,b];		
	}
}

	//enableParallaxContainer - superseded approach
	    //a resizing approach using linearity: superseded by css vw on height attribute
				
			/*let m = parseFloat(parallaxContainer.dataset.m);    //determines the rate of change of height compared to width (start with default 0.5)
			let q = parseFloat(parallaxContainer.dataset.q);    //plus the initial value, obtained by trial and error in a limit case of small viewport size
			
			let height = m * window.innerWidth + q; 
			parallaxContainer.style.height = height+"px";       //this works because this function is being invoked on DOMContentLoaded	
			
			window.addEventListener("resize", () => {
				height = m * window.innerWidth + q; 
				parallaxContainer.style.height = height+"px";
			});*/