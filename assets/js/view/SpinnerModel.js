/*
emulate the java SpinnerModel interface, that is used to implement data structures 
that are used inside dedicated Component (graphic elements);

the name is just a cognitive shortcut, since this class is a FACTORY 
of html code ((VIEW) TEMPLATE), that describes nodes to pick numbers or text.
with the static method getKeyValues(Node) a Node is parsed to extract 
a key-value pair, that can be properly processed further

for the input fields, like numbers or a list of finite items
the constructor input array:
if the input is a range     : ["$number",min,max,step,"str0","str1","str2"]
if it's an open text field  : ["$text"]
if it's a list of items     : ["itemA","itemB",...,...]
note that these are the only formats available so far, so Date, etc must be converted to one of them,
for instance dividing months, year, but requiring special handling if the combo month, day is present 


once initialized, it can return an html description of the item
*/

const NUMBER = "number";
const TEXT   = "text";
const LIST   = "list";
const CLASSNAME = "SpinnerModel.js";

class SpinnerModel{

	constructor(array,datakey){
		if(!Array.isArray(array))
			throw new Error("the input for this class must be a specific type. Read instructions in the class");
	
		if(array[0].includes("$"))
			if(array[0].includes("number")){
				this.min = array[1];
				this.max = array[2];
				this.stp = array[3];
				this.type = NUMBER;
				
				if(array.length > 4)
					this.from = array[4];
				if(array.length > 5)
					this.to = array[5];
				if(array.length > 6)
					this.step = array[6];		
			}    
			else
				this.type = TEXT;
		else{
			this.list = array;
			this.type = LIST;
		}
		
		this.datakey = datakey;
	}
	
	getHTMLDescription(style){	
       let descr = [`<div class="${CLASSNAME}">`];
	
		if(this.type === NUMBER)
			if(this.from){
				descr.push(`<input class="${style}" type="${NUMBER}" data-key="${this.datakey}" placeholder="${this.from}" min="${this.min}" max="${this.max}" step="${this.stp}">`);
			    if(this.to)
				    descr.push(`<input class="${style}" type="${NUMBER}" data-key="${this.datakey}" placeholder="${this.to}" min="${this.min}" max="${this.max}" step="${this.stp}">`);
			        if(this.step)
			            descr.push(`<input class="${style}" type="${NUMBER}" data-key="${this.datakey}" placeholder="${this.step}" min="${this.min}" max="${this.max}" step="${this.stp}">`);
		    }
		    else
			    descr.push(`<input class="${style}" type="${NUMBER}" data-key="${this.datakey}" min="${this.min}" max="${this.max}" step="${this.stp}">`);
		else
		if(this.type === TEXT)
			descr.push(`<input class="${style}" type="${TEXT}" data-key="${this.datakey}" placeholder="[...]">`);
		else{
			descr.push(`<select class="${style}" type="${TEXT}" data-key="${this.datakey}">`);
			for(let i=0;i<this.list.length;i++){
				descr.push("<option>");
			    descr.push(this.list[i]);
			    descr.push("</option>");
			}		
			descr.push(`</select>`);
		}
		
		descr.push("</div>");
		 
		return descr.join("");
	}
	
	//The input object is a Node. The Node is scanned, trusting it's generated from this class 
	//If not, the output value will depend on what's actually inside the Node
	static getKeysValues(node){		
		let fields = node.querySelectorAll("input,select");    //safe: not both are present at the same time
        let values = [];		
		for(let i=0;i<fields.length;i++)
			values.push(fields[i].value);
		
		return [fields[0].dataset.key, values];
	}
}