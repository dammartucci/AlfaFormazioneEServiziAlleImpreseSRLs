class DataBaseViewer{

    initialize(values){}

    translateDbEntryIntoHTML(dbEntry){}
	
	postProcessNode(node){}
	
}

class CarLTRDataBaseViewer extends DataBaseViewer{    
	
	constructor(){
		super();
	    this.dsu = new DataStructureUtilities();
		this.dru = new DataRenderingUtilities();	
		
		this.ERROR_MESSAGE = "ERROR! Something went wrong during the generation of the node";
		this.NULL = "-";
	}
	
	async loadAdditionalResources(){
		let style  = this.dru.getCSSRule("spinner > canvas");
		this.style = await this.dru.translateCSSStyleRuleIntoObject(style);
	}

    //MODEL

    initialize(values){
	    this.metadata   = values;
		this.langlabels = this.metadata[0].$LTROfferSelection;
		
		this.r  = 0.05/12.0;
		this.W0 = 0.5;
		this.W1 = 1 - 0.5;
		
		this.initializeTablesHeader(["$name"]);
	}
	
	initializeTablesHeader(excluded){
		let temp = this.dsu.excludeKeys(this.metadata[0].LTRFinancialData,excluded);
		
		this.tableHeader = this.dsu.translateStructureIntoStringArray(
		    this.dsu.sumStructure(temp,this.metadata[1].LTRFinancialData,": "));	
			
	    let labels = [...this.tableHeader];
		labels.push(...this.langlabels.rankingparams);
		this.evaluationTableHeader = labels;
		this.axesnames             = this.dsu.translateStructureIntoStringArray(temp);
	}
	
    rankOffers(tableRows){	  
        let length = tableRows.length;	
		let totalCosts = [], costPerKm = [], npv = [];
		let initialPayment,kmPerYear,durationMonths,monthlyPrice;
		for(let i=0;i<length;i++){
			initialPayment = tableRows[i][0];
			kmPerYear      = tableRows[i][1];
			durationMonths = tableRows[i][2];
			monthlyPrice   = tableRows[i][3];
			
		    totalCosts[i]  = initialPayment + durationMonths * monthlyPrice;
		    costPerKm[i]   = totalCosts[i]/(kmPerYear * durationMonths / 12.0);	
			npv[i]         = initialPayment + monthlyPrice * (1-Math.pow(1+this.r,-durationMonths))/this.r;		
		}
		
		let minCostPerKm, maxCostPerKm, minNPV, maxNPV;
		minCostPerKm = Math.min(...costPerKm);
		maxCostPerKm = Math.max(...costPerKm);
		minNPV       = Math.min(...npv);
		maxNPV       = Math.max(...npv);

		let w0 = this.W0/(maxNPV - minNPV), 
		    w1 = this.W1/(maxCostPerKm - minCostPerKm), convScore = [];
		
		for(let i=0;i<length;i++)
			convScore[i] = w0 * (npv[i] - minNPV) + w1 * (costPerKm[i] - minCostPerKm);
			
	    return [totalCosts,costPerKm,npv,convScore];
	}
	
	getRows(tableRows){
		let rows = this.dsu.excludeRows(tableRows,this.NULL);
		let cols = this.rankOffers(rows);
		rows = this.dsu.appendColumns(rows,cols,true);	
        rows = this.dsu.sortByColumn(rows,7,false);		
		return rows;
	}
	
	//VIEW TEMPLATE
	
	translateDbEntryIntoHTML(dbEntry){
	    let html = this.ERROR_MESSAGE;
		
		try{
			let browsables = [];
			let imageDirs  = dbEntry.$info.imageDirs;
			for(let i=0;i<imageDirs.length;i++)
				browsables.push(`<img class="fluid-element" src="${imageDirs[i]}"></img>`);
			
		    //this.tableRows = this.dsu.constructTableRowsFromStructure(dbEntry.LTRFinancialData);
			let data = this.dsu.extractPlottableData(dbEntry.LTRFinancialData);
		    this.tableRows = this.dsu.constructTableRows(data[0],data[1]);
			
			this.spinnerFact = new SpinnerPickerFactory();
			for(let i=0;i<data[0].length;i++)
				this.spinnerFact.setSpinnerPickers(data[0][i],this.axesnames[i]);

			html = `
				<div class = "common-overlaid-container expandable-container togglable add-med-spacing spawn-element">
					<div class="expandable-container-title togglable-enabler align-items-center row">
						<div class="col-md-6">
							<h3><b>${this.dsu.translateStructureIntoString(dbEntry.name," ")}</b></h3>
							<h4>${this.dsu.translateStructureIntoString(this.dsu.sumStructure(dbEntry.specs,this.metadata[1].specs," ")," ")}</h4>
						</div>	
						<div class="col-md-6 browsable-container">
							<div class="browsables">${browsables.join("")}</div>
						</div>
					</div>
					
					<div class="expandable-container-content"> 
						<p class="add-min-vert-spacing"><i><b>${dbEntry.$info.textDescription}</i></b><br></p>
						${this.dru.translateStructureIntoHierarchicalHTML(
							this.dsu.sumStructures(this.metadata[0].wearLevel,dbEntry.wearLevel,this.metadata[1].wearLevel,": "," ")," ")}
						
						<h3>${this.metadata[0].LTRFinancialData.$name}</h3><br>
						<div class="flex-container wrap" data-insertspinners="">
						    ${this.spinnerFact.getHTMLDescription(true)}
							<div>${this.langlabels.price}<br><h2><label></label>${this.langlabels.currency}</h2> ${this.langlabels.taxinfo}</div>
							<button data-button="" class="common-container common-button add-min-spacing">${this.langlabels.iwantthisone}</button>
						</div>
						
						<!--div data-inserttable="">
						    <button data-button="" class="common-container common-button add-min-spacing">${this.langlabels.chooseoffer}</button>
						</div-->
					</div>
				</div>
			`; 	
		  }catch(exception){console.log(exception);}/*can throw an access error if a value is undefined*/
	
        return html;	
	}
	
	//VIEW RENDERING
	
	postProcessNode(node){
		/*let button    = node.querySelector("[data-inserttable]").querySelector("[data-button]");
		let nodeTable = this.tableRows;                 //copy the reference to preserve this current version of it.
		button.addEventListener("click",()=>{
			this.createChooseOfferDialog(node,nodeTable);
		});*/
		
		let tablestruct = this.dsu.buildLookupTable(this.tableRows);   //copy the reference to preserve this current version of it.
		let spinnerfact = this.spinnerFact;
		spinnerfact.postProcessNode(node,this.style);
		
		let subtree = node.querySelector("[data-insertspinners]");
		let label   = subtree.querySelector("label");
		this.updateLabel(label,tablestruct,spinnerfact);
		subtree.addEventListener("mousemove",()=>{this.updateLabel(label,tablestruct,spinnerfact)});
		subtree.addEventListener("touchmove",()=>{this.updateLabel(label,tablestruct,spinnerfact)});
	}
	updateLabel(label,tablestruct,spinnerfact){
		label.innerHTML = this.dsu.getValueFromStructure(tablestruct,spinnerfact.getSelectedValues());
	}

    //AUXILIARY METHODS	
	
	createChooseOfferDialog(node,table){
		let rows = this.getRows(table);  //warning! tableRows may not be the same of the node. 
		
		let html = `
			<div data-table="" class="common-overlaid-container table-container togglables-xor-container">
				${this.dru.translateIntoHTMLTable(rows,this.evaluationTableHeader)}
			</div>
			<p class="add-med-spacing"><i>${this.langlabels.paramsexplain}</i></p>
			<p class="add-min-spacing">${this.langlabels.selectoffer}</p>
			<button data-button="" class="common-container common-button add-min-spacing">${this.langlabels.iwantthisone}</button>	
		`;
		
		let dialog = node.querySelector("[data-inserttable]");
		dialog.innerHTML = html;
		
		let htmlrows = dialog.querySelector("[data-table]").querySelectorAll("tr:not(thead tr)");  //exclude the title as togglable row
		for(let i=0;i<htmlrows.length;i++)
			htmlrows[i].classList.add("togglable");              //this to ensure that a row can be toggled by clicking onto it
		
		dialog.querySelector("[data-button]").addEventListener("click",()=>{
			this.#handleInquirySubmission(htmlrows);
		});	
	}	
	#handleInquirySubmission(htmlrows){
		let selectedrow;
		for(let i=0;i<htmlrows.length;i++)
			if(htmlrows[i].classList.contains("togglable-clicked")){
				selectedrow = htmlrows[i];
				break;
			}
		if(!selectedrow)
			alert(this.langlabels.noofferselected);
		else{
			//compile a form using the selected row for submitting to the business
		}
	}
}