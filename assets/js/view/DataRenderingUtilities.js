/*STRUCTURE OF THIS CLASS 
#recursiveTranslateStructureIntoHierarchicalHTML(struct,arr) VIEW(TEMPLATE)
translateStructureIntoHierarchicalHTML(struct) VIEW(TEMPLATE)
extractPlottableData(
*/

const TABLE = "#";

class DataRenderingUtilities{
	
	constructor(){
		this.dsu = new DataStructureUtilities();
	}
	
	/*
	takes a data structure as input, and displays it as a unordered list,
	whose levels depend on the original structure
	
	let struct = {
		"$name": "name0",
		"k0":{
			"$name":"name",
			"key0":"val0",          =>   <h3>name0</h3><ul><h3>name</h3><ul><li>val0</li><li>val1</li></ul><h3>name2</h3><ul><li>val1</li></ul></ul>
		    "key1":"val1"
		},
		"k1":{   
		    "$name":"name2",
			"key1":"val1",
			"$dontshow":"hidden"
		}
	};
	*/
	

    #recursiveTranslateStructureIntoHierarchicalHTML(struct,arr){
		if(struct.hasOwnProperty("$name"))
		    arr.push(`<h3>${struct.$name}</h3>`); 
		
		if(this.dsu.hasOneDimension(struct)){
			arr.push("<ul>");
			for(let key in struct)
				 if(!key.startsWith(EXCLUDEKEY)){
					 arr.push("<li>");
					 arr.push(struct[key]);
					 arr.push("</li>");
				 }
			arr.push("</ul>");		 
		}
		else
		if(this.dsu.hasZeroDimension(struct)){
			arr.push(`<ul><li>${struct}</li><ul>`);
		}
		else{
			arr.push("<ul>");
			for(let key in struct){
				if(!key.startsWith(EXCLUDEKEY))
					this.#recursiveTranslateStructureIntoHierarchicalHTML(struct[key],arr);
			}
			arr.push("</ul>");			
		}	
	}
    translateStructureIntoHierarchicalHTML(struct){
		let out = [];
		this.#recursiveTranslateStructureIntoHierarchicalHTML(struct,out);
		return out.join("");		
	}
	
	
	translateIntoHTMLTable(rows,colsNames){
	    let out = ["<table><thead><tr>"];
	
	    for(let i=0;i<colsNames.length;i++)
			out.push(`<th>${colsNames[i]}</th>`);
		
		out.push("</tr></thead>");
	
	    for(let i=0;i<rows.length;i++){
			out.push("<tr>");
			
			for(let j=0;j<rows[i].length;j++)
				out.push(`<td>${rows[i][j]}</td>`);
				
			out.push("</tr>");
		}

	    out.push("</table>");
		return out.join("");
	}
	
	//loading CSS properties for styling custom nodes running in js
	
	getCSSRule(name){
		for(let i=0;i<document.styleSheets.length;i++){
			let rules = document.styleSheets[i].cssRules;
			for(let j=0;j<rules.length;j++)
				if(rules[j].selectorText == name)
					return rules[j];
		}
		return null;			
	}
	
	async loadImage(src) {
		return new Promise((resolve, reject) => {
			let img = new Image();
			img.onload = () => resolve(img);       // resolved when fully loaded
			img.onerror = err => reject(err);      // rejected if loading fails
			img.src = src;
		});
	}
		
	async translateCSSStyleRuleIntoObject(struct){
		if(! (struct instanceof CSSStyleRule))
			throw new Error("the input structure is not an instance of CSSStyleRule: "+ struct);
		let props = struct.style.cssText.split(";");
		let out   = {};
		
		for(let i=0;i<props.length;i++){
			if(props[i] == "")
				continue;
				
			let tmp = props[i].split(":");
			let key = tmp[0].replaceAll(/ /g,"");
			let val = tmp[1];
			
			if(key.includes("image"))
				val = await this.loadImage(val.split('"')[1].split('"')[0]);
		
			else
				val = val.replaceAll('"',"");
			
			out[key] = val;
		}
		return out;		
	}   
}