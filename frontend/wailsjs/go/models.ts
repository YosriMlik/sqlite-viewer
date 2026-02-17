export namespace main {
	
	export class Column {
	    Name: string;
	    Type: string;
	    NotNull: boolean;
	    DefaultValue: string;
	    PrimaryKey: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Column(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.Type = source["Type"];
	        this.NotNull = source["NotNull"];
	        this.DefaultValue = source["DefaultValue"];
	        this.PrimaryKey = source["PrimaryKey"];
	    }
	}
	export class QueryResult {
	    Columns: string[];
	    Rows: string[][];
	
	    static createFrom(source: any = {}) {
	        return new QueryResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Columns = source["Columns"];
	        this.Rows = source["Rows"];
	    }
	}

}

