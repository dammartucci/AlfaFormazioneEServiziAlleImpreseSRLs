const SUBMIT_BUTTON = "Survey.js-submit-button";

class Survey{
	
	constructor(){
		this.dsu = new DataStructureUtilities();
	}
	
	async loadSurvey(dir){
		this.data = await this.dsu.loadData(dir);
		this.keyValues = new Map();
	}
	
	
    translateSurveyIntoHTML(struct){
	    let out  = [`<div class="Survey.js">`];
	    this.#recursiveTranslateSurveyIntoHTML(struct,out);
	    out.push(`</div>`);
		return out.join("");
	}
	#recursiveTranslateSurveyIntoHTML(struct,out){
	    if(this.dsu.hasTwoDimensions(struct)){	
		    out.push(`<div>`);
		    
			if(struct.$info !== undefined){
				if(struct.$info.title != undefined)
					out.push(`<h2>${struct.$info.title}</h2>`);
				if(struct.$info.end != undefined)
					out.push(`<button id="${SUBMIT_BUTTON}" class="common-menu-button add-med-spacing">${struct.$info.end}</button>`);
				if(struct.$info.text != undefined)
					out.push(`<p>${struct.$info.text}</p>`);
			}
			let keys = Object.keys(struct);
			for(let i=0;i<keys.length;i++)
				if(keys[i] != "$info"){
					out.push(this.createOptionsToggler(keys[i],struct[keys[i]].text,struct[keys[i]].options));
					this.keyValues.set(keys[i],struct[keys[i]].values);
				}
			
			out.push(`</div>`);
		}
		else{
		    out.push(`<div class="browsable-container flex-container"><div class="browsables">`);
		    for(let i=0;i<struct.length;i++)
			    this.#recursiveTranslateSurveyIntoHTML(struct[i],out);
			out.push(`</div></div>`);
		}
	}
	
	createOptionsToggler(key,text,options){
	    let out =  [`<div class="OptionsToggler.js" data-key="${key}"><div class="togglables-xor-container">`];
		out.push(`<h3 class="add-med-spacing">${text}</h3>`);				 
                
		for(let i=0;i<options.length;i++)
			out.push(`<button data-index="${i}" class="togglable-button common-menu-button add-min-spacing spawn-element">${options[i]}</button>`);
		
		out.push(`</div></div>`);
		
		return out.join("");
	}
	
	getSelectedKeysValues(id){ 
		let out = [];
		let key,val;
		let nodes = document.getElementById(id).querySelector(`[class="Survey.js"]`).querySelectorAll(`[class="OptionsToggler.js"]`);
		for(let i=0;i<nodes.length;i++){
			key  = nodes[i].dataset.key;
			val  = undefined;
		    let items = nodes[i].querySelectorAll(".togglable-button"); 
            for(let j=0;j<items.length;j++)
				if(items[j].classList.contains("togglable-clicked"))
					val = this.keyValues.get(key)[j];
	
			if(val !== undefined)
				out.push([key,val]);
		}
		return out;
	}
	
	async displaySurvey(id){				
		let node = document.getElementById(id);
		node.innerHTML = this.translateSurveyIntoHTML(this.data);   //destructive operation
		
		return new Promise((resolve) => {
			document.getElementById(SUBMIT_BUTTON).addEventListener("click",()=>{
				let out = this.getSelectedKeysValues(id);
				node.innerHTML = "";
				resolve(out);
			});	
		});
	}
}