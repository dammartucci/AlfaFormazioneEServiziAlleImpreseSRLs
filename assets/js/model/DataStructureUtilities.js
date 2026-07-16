
/*STRUCTURE OF THIS CLASS       
async loadData(filename) MODEL
excludeKeys(struct,exclKeys) MODEL  
hasTwoDimensions(struct) MODEL                       
hasOneDimension(struct) MODEL
hasZeroDimension(struct) MODEL
#recursiveSumStructure(struct0,onStruct1,order,separator) MODEL
#sumStructure(struct0,onStruct1,order,separator) MODEL
static recursiveTranslateStructureIntoStringArray(struct,arr) MODEL
static translateStructureIntoString(struct) MODEL
*/

const NO2DMATRIX = "The input array has not two dimensions";

class DataStructureUtilities{

    async loadData(filename){
		let file = await fetch(filename);    //doesn't work with local testing if CORS rules are active!
		let data = await file.json();
	    return data;
	}
	
	excludeKeys(struct,exclKeys){
		let out = structuredClone(struct);
		
		for(let i=0;i<exclKeys.length;i++)
			if(out[exclKeys[i]] !== undefined)
		        delete out[exclKeys[i]];
		
		return out;
	}
    	
	//STRUCTURES: check number of dimensions
	hasZeroDimension(struct){
		if(!struct)
		    return false;
		if(typeof(struct) != "object")
			return true;
		else 
			if(Array.isArray(struct))
			    return true;
			else
				return false;
	}
	
	hasOneDimension(struct){
	    if(!struct)
		    return false;
			
	    if(typeof(struct) == "object")
			for(let key in struct){
				if(typeof(struct[key]) == "object" && !Array.isArray(struct[key]))  //instanceof(obj)
	                return false;
			}
        else
            return false;		
			
		return true;	
	}
	
	hasTwoDimensions(struct){
		if(!struct)
		    return false;
		for(let i=0;i<struct.length;i++)
			if(!this.hasOneDimension(struct[i]))
				return false;
		
		return true;		
	}
	
	
	//STRUCTURES: access a structure datum by using a composite key, given as a sequential string of keys
	
	getValueFromStructure(struct,keystring){
		let out = struct[keystring[0]];
		for(let i=1;i<keystring.length;i++)
		    out = out[keystring[i]];
		return out;
	}
	
	//STRUCTURES: merge structures data of the same type into one. returns a new structure
	
	sumStructures(s0,s1,s2,sep0,sep1){
		let inner = this.sumStructure(s0,s1,sep0);
		return this.sumStructure(inner,s2,sep1);		
	}		
	sumStructure(struct0,struct1,separator){
		let out = structuredClone(struct0);
		this.#recursiveSumStructure(struct0,struct1,out,separator);
		return out;		
	}
	#recursiveSumStructure(struct0,struct1,out,separator){		
        if(this.hasOneDimension(struct0))
			for(let key in struct0){
				let val;
				if(struct1[key] != undefined)
					val = struct1[key];
			    else
					val = "";
	
				out[key] = struct0[key] + separator + val;
			}
			
		else
			for(let key in struct0)
			    this.#recursiveSumStructure(struct0[key],struct1[key],out,separator);
	}
	
	//STRUCTURES: return a string or a string array containing only values, so without keys
	/*
	EXPLAINATION:
	let datastructure = {
			"axis0": [0,5000,6000,7000],
			"axis1": [10000,15000,20000],
			"axis2": [36,48,60],
			
			"#matrix": [[[765,695,640],[799,729,755],[825,755,699]],
			            [[626,590,556],[660,624,591],[686,650,615]],
						[[598,570,540],[632,600,575],[658,630,599]],
						[[570,549,523],[604,583,558],[630,609,582]]],
			
			"matrix": [523,825]
		}
	
	using translateStructureIntoString, the input parameter datastructure is turned into this string, using comma as separator:
	
	let output = "0,5000,6000,7000,10000,15000,20000,36,48,60,765,695,640,799,729,755,825,755,699,626,590,556,660,624,591,686,650,615,598,570,540,632,600,575,658,630,599,570,549,523,604,583,558,630,609,582,523,825"
	*/
	translateStructureIntoStringArray(struct){
		let out = [];
		this.recursiveTranslateStructureIntoStringArray(struct,out);
		return out;		
	}
	translateStructureIntoString(struct,joiner){
		let out = [];
		this.recursiveTranslateStructureIntoStringArray(struct,out);
		return out.join(joiner);		
	}
	recursiveTranslateStructureIntoStringArray(struct,arr) {
		if(this.hasOneDimension(struct))
			for(let key in struct)
				arr.push(struct[key]);
		else
		if(this.hasZeroDimension(struct))
		    arr.push(struct);
		else
			for(let key in struct)
			    this.recursiveTranslateStructureIntoStringArray(struct[key],arr);
	}
		
	
	//STRUCTURES: if the structure contains domain and range values, extract them by returning a vector containing them
	/*
	EXPLAINATION:
	give a look to parameter datastructure provided as an example to understand
	plottable data are recognizable because the sub-structure has a key beginning with #
	axes represents domain axes, the #matrix represents range values. Works for any number of dimensions
	*/

	extractPlottableData(struct){
		let excludeKey;
		
		for(let key in struct)
			if(key.startsWith(TABLE))
				excludeKey = key.substring(1);
		
		if(!excludeKey)
			throw new Error("an error occurred while extracting plottable data: no matrix to plot");
		
		let axes = [];
		let matrix;
		for(let key in struct)
			if(!key.startsWith(TABLE)){
				if(key != excludeKey)
				    axes.push(struct[key]);
			}
			else
				matrix = struct[key];
		
		return [axes,matrix];
	}
	
	
	//ARRAYS: return the max number of dimensions
	/*
	EXPLAINATION: an array like this: [[a],[b],[[[c,d]]]] has a 
	total of 4 dimensions.
	*/
	
	arrayDimensions(arr) {
		if (!Array.isArray(arr)) return 0; // not an array
		
		let maxDepth = 0;
		for (const item of arr) 
		    maxDepth = Math.max(maxDepth, this.arrayDimensions(item));
		
		return 1 + maxDepth;
	}
	
	//ARRAYS: flatten an array of any dimensions into a one-dimensional array
	/*
	EXPLAINATION: 
	an array like this: [[0,5000],[222]]; is flattened to 
	one dimensional array: [0,5000,222]. we can call this 
	a "spread operator for multidimensional arrays"	since
	the next application of the spread operator reduces it 
	into a list of elements
	*/
	
	arrayFlatten(arr){
		let out = [];
		this.recursiveArrayFlatten(arr,out);
		return out;
	}
	recursiveArrayFlatten(arr,out){
		if(this.arrayDimensions(arr) == 1) 
			for(let i=0;i<arr.length;i++)
				out.push(arr[i]);
		else
			for(let i=0;i<arr.length;i++)
				this.recursiveArrayFlatten(arr[i],out);	
	}
	
	//ARRAYS: gives as input domain and range values, construct a table, that is returned as a 2d array, 
	//where outer dimension is row and inner dimension is a tuple of domain values permutation and associated range value
	/*
	EXPLAINATION: 
	given as input: let axes   = [[0,5000],
                                  [222]];

                    let matrix = [[Y0],[Y1]];
	
	the method computes the dispositions of the axes values, 
	and finally associates the y value:
	
	   [[0,222,Y0],
		[5000,222,Y1]]
	*/
	
	constructTableRows(axes,matrix){
	    let rows = [], cols = [], i=-1;
		this.recursiveConstructTable(i,axes,matrix,cols,rows);
		return rows;	
	}
	recursiveConstructTable(i,axes,array,cols,row){
	    if(i == axes.length -2){
		    i++;
            for(let j=0;j<axes[i].length;j++){
			    cols.push(axes[i][j]);
			    cols.push(array[j]);
			    row.push([...cols]);    //copy the contents
                cols.pop();
                cols.pop();				
			}		
		}
		else{
		    i++;
		    for(let j=0;j<axes[i].length;j++){
			    cols.push(axes[i][j]);
				this.recursiveConstructTable(i,axes,array[j],cols,row);
				cols.pop();
			}	
		}
	}
	
	constructTableRowsFromStructure(struct){
		let data = this.extractPlottableData(struct);
		return this.constructTableRows(data[0],data[1]);
	}
	
	/*given this matrix: [[1,1,232,4], and this: [[1,8], if transpose                         [[1,1,232,4,1,2],
	                      [33,3,44,6]]            [2,9]] the second is appended like this:     [33,3,44,6,8,9]]
	*/
	
	appendColumns(matrix,cols,transpose){
		if(this.arrayDimensions(matrix) !=2)
			throw new Error(NO2DMATRIX);
	    
		if(transpose)
			for(let i=0;i<matrix.length;i++)
				for(let j=0;j<cols.length;j++)
					matrix[i].push(cols[j][i]);
		else
			for(let i=0;i<matrix.length;i++)
				for(let j=0;j<cols.length;j++)
					matrix[i].push(cols[i][j]);
		
		return matrix;
	}
	
	excludeRows(matrix,errorChar){
		if(this.arrayDimensions(matrix) !=2)
			throw new Error(NO2DMATRIX);
		
		let out = [];
		let bool;
		for(let i=0;i<matrix.length;i++){
			for(let j=0;j<matrix[i].length;j++){
				bool = true;
			    if(matrix[i][j] == errorChar)
					bool = false;
			}
			if(bool)
				out.push(matrix[i]);
		}
		return out;		
	}
	
	sortByColumn(matrix,colIndex,descending){
		if(this.arrayDimensions(matrix) !=2)
			throw new Error(NO2DMATRIX);
		
		if(typeof(matrix[0][colIndex]) === "number")
			if(descending)
				return matrix.sort((a,b) => b[colIndex] - a[colIndex]);
			else
				return matrix.sort((a,b) => a[colIndex] - b[colIndex]);
		else
            if(descending)
				return matrix.sort((a,b) => b[colIndex].toLowerCase().localeCompare(a[colIndex].toLowerCase()));
			else
				return matrix.sort((a,b) => a[colIndex].toLowerCase().localeCompare(b[colIndex].toLowerCase()));	
	}
	
	/*
	given a table in form of monodimensional array, 
	constructs an object to reduce the cost of searching items in the table
	by key corresponding values. this because the index may not be available
	[[a,0,0,1],[a,0,1,23],[a,0,2,3.3]]   =>  "a": {
													"0": {
														"0": 1;
														"1": 3;
														"2": 3.3;
													}
												}
	*/
	buildLookupTable(table){
		let out = {};
		let key = "";
        for(let i=0;i<table.length;i++){ 
		    let temp = out;
			
			for(let j=0;j<table[i].length -2;j++){
				key = table[i][j];
			    if(!temp[key]) temp[key] = {};
				temp = temp[key];
			}
			temp[table[i][table[i].length-2]] = table[i][table[i].length-1];
		}
		return out;		
	}
}