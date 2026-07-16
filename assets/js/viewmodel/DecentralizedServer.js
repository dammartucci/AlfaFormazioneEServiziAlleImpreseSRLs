//SO FAR, DATABASES ARE ONLY BE MANAGED BY A SERVER. so static websites shouldn't be able
//to do so. Is this true? In this class, I implemented a hierarchical database with javascript!
//in this way, the server is decentralized to the destination machine. 

/*I call this "Server Decentralization" or "Server Emulation".
Advantages:
    -no additional costs for a dedicated PHP server, allowing a better QOS for small businesses;
	-database scalability: entries can be added indefinitely;
	-self-generated query search bar, depending on json data structure, and inner query search engine to manage queries;
Neutral (depends on POVs):
    -the source code and the entire database is shared with every client;
Disadvantages:
    -loading performance depends on database size, client machine processing power and internet bandwidth;
	-searching performance depends on database size, and client machine processing power;
	-can't use for sensitive data, since they can be manually accessed by inspecting the json archive.
Conclusions:
Some disadvantages are not negotiable. The class has a limited usage scope.
*/

/*THE INPUT IS A JSON FILE, conventionally called archive_lang.json, that must have a precise data structure.
the reason why this particular structure exists is to provide at the same time both the data
and the corresponding filters to be applied on them. 
to accomplish this, labels, measurement units, acceptable data ranges, are required, 
and occupy respectively the first three entries the json array.

STEPS TO DEFINE YOUR DATA STRUCTURE. string values only are used:
  1.create a monodimensional key-value pairs list for a sample item to model, covering all possible cases.
    then begin the abstraction: 
  2.if needed, group the leaves semantically in sub data structures. now copy and paste three times.
  3A.for each leaf, define the corresponding name, including the name of the sub-structure as "$name" key. 
     if the sub-array must not be considered as filter, prepend the sub-array key with $.
  3B.then write the associated measurement units, empty string if not present.
  3C.finally the acceptable range. the info about ranges is contained in the actuator class, SpinnerModel.js
now, the fourth item is the first item of the dataset to represent.
*/

/*STRUCTURE OF THIS CLASS       AND       ACTIONS TO PERFORM ON THE INLINE SCRIPT CONTAINED IN THE WEBPAGE YOU WISH TO USE THIS CLASS ON:

async loadArchive(filename) MODEL                  X   PROVIDE FILENAME PATH
applyFiltersResolvingType(kv) MODEL
#applyANDFiltersOnData(ktv) MODEL
filterValues(data,key,filter) MODEL

#recursiveTranslateMetaStructureIntoHTML(struct0,struct1,struct2,out,abskey) VIEW(TEMPLATE)
translateMetaStructureIntoHTML() VIEW(TEMPLATE)

translateDataChunkIntoNodes() VIEW(RENDERING) MODEL
#translateDataChunkIntoNodes2() VIEW(RENDERING) MODEL
repaint(id) VIEW(RENDERING) MODEL
displayElements(id) VIEW(RENDERING) MODEL
initializeSearchBarAndFeed(id,id2) VIEW(RENDERING)            X   PROVIDE ID OF SEARCH BAR and DATA FEED <div>
setDisplayElementsDynamically(bool,id2) VIEW(RENDERING)

getCurrentSearchBarKeyValues(id) VIEW(EDITING)
resetSearchBar(id) VIEW(EDITING)      
*/

const ERROR_MESSAGE = "ERROR! Something went wrong during the generation of the node";
const META = 3;
const INCR = 12;

const WILDCARD = "*", EXCLUDEKEY = "$";

class DecentralizedServer{

    constructor(dbViewer){
		this.dbv = dbViewer;
		this.dsu = new DataStructureUtilities();
		this.nodesHashMap = new Map();	
	}	
	
	//MODEL
   
	async loadArchive(filename){
		let data = await this.dsu.loadData(filename);
        
		this.metadata     = data.slice(0,META);
		this.originalData = data.slice(META); 
		this.filteredData = this.originalData;
		this.index = 0;
		
		this.dbv.initialize(this.metadata);
	}
	
	applyFiltersResolvingType(keysValues){
		let out = [];
		for(let i=0;i<keysValues.length;i++){
		    let key  = keysValues[i][0].split(".");
			let type = this.metadata[2][key[0]];
            for(let j=1;j<key.length;j++)	
			    type = type[key[j]];
	
			type = type[0];
			
			out.push([keysValues[i][0],type,keysValues[i][1]]);
		}
		
		this.#applyANDFiltersOnData(out);
	}
	normalizeFilters(ktv){              //ktv[i]: ["key","type",["value[j]",".."]],
		let out = [];
	    outer : for(let i=0;i<ktv.length;i++){
			if(!Array.isArray(ktv[i][2]))         //check if value is an array
			    ktv[i][2] = [ktv[i][2]];
			
			for(let j=0;j<ktv[i][2].length;j++)   //check if value contains a wildcard character
			    if(ktv[i][2][j] == WILDCARD)
			        continue outer;

			out.push(ktv[i]);		
		}	
		return out;
	}
	#applyANDFiltersOnData(ktv){
        ktv = this.normalizeFilters(ktv);	    
		this.filteredData = this.originalData;
		
		for(let i=0;i<ktv.length;i++){
		    let key = ktv[i][0];  
			let typ = ktv[i][1];
			let val = ktv[i][2];
			let filter;
				
			//console.log(key + " " + typ + " " + val);
			
			if(typ.includes("$number")){  //if a number, check equality or belonging to interval
				if(typ.includes("array")){
				    if(val.length == 1) 
					    filter = (value) => {
						   for(let i=0;i<value.length;i++)
								if(value[i] == val[0])
								    return true;
						   return false;
						};
				    else{
					    let min = Number(val[0]);
						let max = Number(val[1]);
					    filter = (value) =>  !(value[value.length-1] < min || value[0] > max); //check if the interval has a partial superposition with the interval [min,max]
					}                                                                          //it means: check if the max value is not contained in [min,max]						
				}
				else{
					if(val.length == 1)
						filter = (value) => value == val[0];
					else{
						let min = Number(val[0]);   //important! we trust that value is a number, since typ includes "number"
						let max = Number(val[1]);
						filter = (value) => value >= min && value <= max;                      //check if number is included in the interval [min,max]					
					}
				}
			}
			else{                              //if text, check for a precise match
			    for(let j=0;j<val.length;j++)
				    val[j] = val[j].toLowerCase();  //normalize the values before comparison
				 
			    if(val.length == 1)
					filter = (value) => {
						value = value.toLowerCase();
 						return value == val[0];           
					};                         //yes, it's the same operation
				else                           //but i split in two cases to optimize
					filter = (value) => {
						value = value.toLowerCase();
					    for(let j=0;j<val.length;j++)
						    if(value == val[j])
							    return true;
						return false;
					};
			}
            //now, apply the just-in-time created filter					
			this.filteredData = this.filterValues(this.filteredData,key,filter);
		}	
	}
	filterValues(data,key,filter){  //this practice is called "memoization". I didn't know about, I independently rediscovered it.
		let out = [];
		let val;
		for(let i=0;i<data.length;i++){
			//check if cache doesn't exist. so allocate
			if(data[i].$cache === undefined){
			    data[i].$cache = {};
				
				let keys = key.split(".");         //resolveAndAllocateValueIn$cache
				val  = data[i][keys[0]];
				for(let j=1;j<keys.length;j++)
				    val = val[keys[j]];	
				data[i].$cache[key] = val;
			}
			else{
				//look for the value in the cache: it may not exist. so allocate
				val = data[i].$cache[key];
				if(val === undefined){
					let keys = key.split(".");    //resolveAndAllocateValueIn$cache
					val  = data[i][keys[0]];
					for(let j=1;j<keys.length;j++)
						val = val[keys[j]];
					data[i].$cache[key] = val;
				}
			}	
			if(filter(val))
				out.push(data[i]);
		}
		return out;		
	}
		
	//VIEW(TEMPLATE)

    #recursiveTranslateMetaStructureIntoHTML(struct0,struct1,struct2,out,abskey){
		out.push(`<div class="common-overlaid-container expandable-container togglable togglable-on-sides"><div class="expandable-container-title togglable-enabler extractable-title">${struct0.$name}</div><div class="expandable-container-content"><div class="row">`);	
		
		if(this.dsu.hasOneDimension(struct0)){
		    for(let key in struct0)
			    if(!key.startsWith(EXCLUDEKEY)){
					abskey.push(key);
					let spinmodel = new SpinnerModel(struct2[key],abskey.join("."));
/*field enabler*/   out.push(`<div class="col-md-6 flex-container"><button class="common-menu-button togglable-button">${struct0[key]}</button>`);            
/*object*/		    out.push(spinmodel.getHTMLDescription("common-overlaid-container"));
/*metric unit*/     out.push(struct1[key]); 
                    out.push(`</div>`);
                    abskey.pop();
				} 
		}
		else
		    for(let key in struct0)
			    if(!key.startsWith(EXCLUDEKEY)){
					abskey.push(key);
					out.push(`<div class="col-md-6 extractable">`);
			        this.#recursiveTranslateMetaStructureIntoHTML(struct0[key],struct1[key],struct2[key],out,abskey);
					abskey.pop();
					out.push(`</div>`);
				}
		
		out.push("</div></div></div>");
	}
	translateMetaStructureIntoHTML(filterbarID,button0ID,button1ID){		
		let out = [];
		let key = [];
		this.#recursiveTranslateMetaStructureIntoHTML(this.metadata[0],this.metadata[1],this.metadata[2],out,key);
		out.pop();
		out.push(`<div class="col-md-12">`);
		out.push(`<button id="${button0ID}" class="common-container common-button">${this.metadata[0].$menu.apply}</button>`);
		out.push(`<button id="${button1ID}" class="common-container common-button">${this.metadata[0].$menu.reset}</button>`);
		out.push(`</div></div><i><b>${this.metadata[0].$menu.edTransparency}</b></i></div></div>`);
		return out.join("");
	}
	
	//VIEW(RENDERING)  MODEL
	
    translateDataChunkIntoNodes(){
		if(this.index > this.filteredData.length - 1)
			if(this.index == 0){
				if(this.filteredData.length == 0){
					if(document.getElementById("no-search-results") === null){
						let node = document.createElement("div");
						node.id = "no-search-results";
						node.innerHTML = `<div><b><i>${this.metadata[0].$menu.empty}</i></b></div>`;
						return [node];	
					}	
					else return [];		
				}
                else return this.#translateDataChunkIntoNodes2();				
			}
			else return [];
		else return this.#translateDataChunkIntoNodes2();
	}	
	#translateDataChunkIntoNodes2(){	
		let eol    = false;
		let start  = this.index;
		let end    = start + INCR;
		if(end > this.filteredData.length - 1){
			end = this.filteredData.length;
			eol = true;
		}
		this.index = end;
		
		let nodes = [];
		for(let i=start;i<end;i++){
			if(this.filteredData[i].$aux.available != this.metadata[2].$aux.available[0])
				continue;
		
			let key = this.filteredData[i].$aux.key;
			let val = this.nodesHashMap.get(key);       //cache the Nodes into a hashmap to optimize 
														//data rendering in case of applying filters
			if(val === undefined){
				val = document.createElement("div");
				val.innerHTML = this.dbv.translateDbEntryIntoHTML(this.filteredData[i]);
				this.dbv.postProcessNode(val);
				this.nodesHashMap.set(key,val);
			}
			nodes.push(val);
		}
		
		if(eol){
			let node = document.createElement("div");
			node.innerHTML = `<div><b><i>${this.metadata[0].$menu.end}</i></b></div>`;
			nodes.push(node);
		}
		
		return nodes;
	}
	
	displayElements(id){				
		let children = this.translateDataChunkIntoNodes();
		let node = document.getElementById(id);
		for(let i=0;i<children.length;i++)
		    node.appendChild(children[i]);
	}
	
    repaint(id){
		this.index = 0;
		document.getElementById(id).innerHTML="";
		this.displayElements(id);
	}

	
	//PROVIDE THE ID OF THE ELEMENT THAT WILL BE USED TO DISPLAY THE SEARCH BAR
    //AND THE ONE TO RENDER DATA
    initializeSearchBarAndFeed(id,id2){
	    let idBut0 = id+"-button0";	
        let idBut1 = id+"-button1";	
		document.getElementById(id).innerHTML = this.translateMetaStructureIntoHTML(id,idBut0,idBut1);
        document.getElementById(idBut0).addEventListener("click",()=>{
		    this.applyFiltersResolvingType(this.getSearchBarCurrentKeyValues(id));
			this.repaint(id2);
		});
		document.getElementById(idBut1).addEventListener("click",()=>{
		    this.resetSearchBar(id);
			this.filteredData = this.originalData;
			this.repaint(id2);
		});
        /*document.getElementById(id2).addEventListener("click",()=>{  //trivially wait for clicks to update
			this.displayElements(id2);
		});	*/    //let's try something more modern...

        this.setDisplayElementsDynamically(true,id2);
	}
	
	/*separating a view instance from the class has a double advantage:
		1. less decoupling from view, not possessing any instance
		2. a controller can externally allow to display the same content on more view elements
	*/
	setDisplayElementsDynamically(bool,id2){
		let id = id2 + "-scroll-end-listener";
		let sentinel = document.getElementById(id);
		
		if(bool)
			if(!sentinel){
				sentinel = document.createElement("div");
				sentinel.id = id;
				sentinel.dataset["listener_scroll_end"] = "1";
				document.getElementById(id2).insertAdjacentElement("afterend",sentinel);

				let observer = new IntersectionObserver(entries =>{    //the listener fires when the sentinel is observed
					if(entries[0].isIntersecting)
						this.displayElements(id2);			
				},{threshold: 0.3});	
				
				observer.observe(sentinel);	
				
				this.observer = observer;
			}
            else{
				this.observer.observe(sentinel);
				document.getElementById(id2).insertAdjacentElement("afterend",sentinel);
			}
							
		else
			if(sentinel && sentinel.parentElement){
			    sentinel.parentElement.removeChild(sentinel);
				this.observer.unobserve(sentinel);
			}			
	}	


	getSearchBarCurrentKeyValues(id){
		let out = [];
	    let spinnerModels = document.getElementById(id).querySelectorAll(`[class="SpinnerModel.js"]`);
	    for(let i=0;i<spinnerModels.length;i++)
			if(spinnerModels[i].previousElementSibling.classList.contains("togglable-clicked"))
				out.push(SpinnerModel.getKeysValues(spinnerModels[i]));
		return out;	
	}
	resetSearchBar(id){
		let out = [];
	    let spinnerModels = document.getElementById(id).querySelectorAll(`[class="SpinnerModel.js"]`);
	    for(let i=0;i<spinnerModels.length;i++)
	        spinnerModels[i].previousElementSibling.classList.toggle("togglable-clicked",false);
	}
}