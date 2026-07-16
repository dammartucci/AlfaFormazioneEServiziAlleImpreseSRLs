/*
Exactly as in SpinnerModel.js, accepted inputs are:
if the input is a range     : ["$number",pref,min,max,step,"str0",optional:"str1",optional:"str2"]
if it's an open text field  : ["$text"]     //not expected
if it's a list of items     : ["itemA","itemB",...,...]
if it's a date              : ["$date",opt:monthprf,opt:dayprf,opt:yearprf, 
                                      yearmin,yearmax, 
									  "monthlabel","daylabel","yearlabel"]
*/

class DateManager extends EventTarget{
	constructor(month,year,startYear,endYear,func){
		super();
		this.startYear = startYear;
		this.endYear = endYear;
		this.daysmax = 28;
		this.self = func;
		
		this.month = month;
		this.year  = year;
		this.evaluateDay();
	}

	selectMonth(month){
		this.month = this.self.circularIndexingFunction(month,1,12);
		this.evaluateDay();
		return this.month;
		
	}
	selectYear(year){
		this.year = this.self.linearIndexingFunction(year,this.startYear,this.endYear);
		this.evaluateDay();
		return this.year;
	}
	selectDay(day){
		return this.self.circularIndexingFunction(day,1,this.daysmax);
	}
	evaluateDay(){
		let month = this.month, year = this.year;
		let oldDaysMax = this.daysmax;
	
		if(month == 2)
			if ( (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0) )  //leap year case: not a century or a century divisible per 4
				this.daysmax = 29;
			else               //normally
				this.daysmax = 28;
		else
			if(month == 4 || month == 6 || month == 9 || month == 11)
				this.daysmax = 30;	
			else
				this.daysmax = 31;
		
		
	    if(oldDaysMax != this.daysmax)
			this.dispatchEvent(new CustomEvent("valuechange"));		
	}
}

class SpinnerPickerFactory{
    
	constructor(){
		this.spinners = [];
		this.titles   = [];
	}
	
	setSpinnerPickers(array,name="",circular=true){
		let title = (name != "")?name+": ":name;
		
		if(array[0][0] == "$"){
			if(array[0].includes("number")){
		        let length = array.length;
				for(let i=5;i<length;i++){
					this.spinners.push(new SpinnerPicker(this.getNavigationFunctionN(array,circular),array[1]));
					this.titles.push(title+array[i]);
				}
			}
            else
		    if(array[0] == "$date"){
				let off = 0, initMonth,initDay,initYear;
				if(array.length == 12){
					off = 3;
					initMonth = array[1];
					initDay   = array[2];
					initYear  = array[3];
				}
				else{
					let date = new Date();
					initMonth = date.getMonth()+1;
					initDay   = date.getDate();
					initYear  = date.getFullYear();	
				}
				
				let dateManager   = new DateManager(initMonth,initYear,array[1+off],array[2+off],this);
			
				let monthFunction = (index) => dateManager.selectMonth(index);
				let yearFunction  = (index) => dateManager.selectYear(index);	
				let dayFunction   = (index) => dateManager.selectDay(index);

				this.spinners.push(new SpinnerPicker(monthFunction,initMonth));
				this.spinners.push(new SpinnerPicker(dayFunction,initDay,dateManager));  //if a change occurs, this element must have attention
				this.spinners.push(new SpinnerPicker(yearFunction,initYear));

				this.titles.push(title+array[3+off]);
				this.titles.push(title+array[4+off]);
				this.titles.push(title+array[5+off]);
	        }
		}
		else{
			this.spinners.push(new SpinnerPicker(this.getNavigationFunctionV(array,circular)));
		    this.titles.push(name);
		}
	}	
	
	getNavigationFunctionN(array,circular){
		if(array[4] == "1")
			if(circular)
				return (index) => this.circularIndexingFunction(index,array[2],array[3]);
			else
				return (index) => this.linearIndexingFunction(index,array[2],array[3]);
		else{
			let out = this.constructArray(array[2],array[3],array[4]);
			if(circular)
				return (index) => out[this.circularIndexingFunction(index,0,out.length-1)];
			else
				return (index) => out[index];
		}
	}	
	getNavigationFunctionV(array,circular){
		if(circular)
			return (index) => array[this.circularIndexingFunction(index,0,array.length-1)];
		else
			return (index) => array[index];  //overflowing items are simply undefined
	}
	
	
	linearIndexingFunction(index,min,max) {
  	    if(index < min || index > max)
			return undefined;

		return index;
	}
	circularIndexingFunction(index, min, max) {
        let  range = max - min + 1;
        return ((index - min) % range + range) % range + min;
    }

	
	constructArray(min,max,step){
	    let length = Math.floor((max - min) / step) + 1;
	    let out = [];
		
		for(let i=0;i<length;i++)
		    out[i] = min + step*i;
			
		return out;	
	}
	
	
	getHTMLDescription(displayInRows){		
		if(this.spinners.length == 1) 
			return `<spinner><p>${this.titles[0]}</p><canvas></canvas></spinner>`;
		
		let out = [];
		if(displayInRows){
			for(let i=0;i<this.spinners.length;i++)
			    out.push(`<spinner><p>${this.titles[i]}</p><canvas></canvas></spinner>`);
		}
        else{
			out.push("<table><thead><tr>");
			for(let i=0;i<this.spinners.length;i++)
			    out.push(`<th>${this.titles[i]}</th>`);
			out.push("</tr></thead><tr>");
			for(let i=0;i<this.spinners.length;i++)
		        out.push(`<td><spinner><canvas></canvas></spinner></td>`);
			out.push(`</tr></table>`);
			
			//this.dru.translateIntoHTMLTable();
		}			
		 
		 return out.join("");
	}
	
	postProcessNode(node,style){
		let htmlspinners = node.querySelectorAll("spinner > canvas");
		
		for(let i=0;i<this.spinners.length;i++){
			this.spinners[i].setCanvas(htmlspinners[i]);
			this.spinners[i].loadCSSProperties(style);
			this.spinners[i].repaint();
		}
	}
	
	getSelectedValues(){
		let out = [];
		let spinner;
		for(let i=0;i<this.spinners.length;i++){
			spinner = this.spinners[i];
			out.push(spinner.arraynavigator(spinner.index));
		}
		return out;		
	}
}