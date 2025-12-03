// Compatibility layer for legacy query builder - minimal implementation
export class QueryBuilder {
  static select(table: string, columns: string[] = ['*']): SelectQuery {
    return new SelectQuery(table, columns);
  }

  static insert(table: string): InsertQuery {
    return new InsertQuery(table);
  }

  static update(table: string): UpdateQuery {
    return new UpdateQuery(table);
  }

  static delete(table: string): DeleteQuery {
    return new DeleteQuery(table);
  }
}

class SelectQuery {
  private table: string;
  private columns: string[];
  private whereConditions: string[] = [];
  private orderByClause: string = '';
  private limitClause: string = '';
  private offsetClause: string = '';
  private params: any[] = [];

  constructor(table: string, columns: string[]) {
    this.table = table;
    this.columns = columns;
  }

  where(condition: string, value?: any): SelectQuery {
    if (value !== undefined) {
      this.params.push(value);
      this.whereConditions.push(`${condition} = $${this.params.length}`);
    } else {
      this.whereConditions.push(condition);
    }
    return this;
  }

  whereIn(column: string, values: any[]): SelectQuery {
    const placeholders = values.map((val) => {
      this.params.push(val);
      return `$${this.params.length}`;
    }).join(', ');
    this.whereConditions.push(`${column} IN (${placeholders})`);
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): SelectQuery {
    this.orderByClause = `ORDER BY ${column} ${direction}`;
    return this;
  }

  limit(count: number): SelectQuery {
    this.params.push(count);
    this.limitClause = `LIMIT $${this.params.length}`;
    return this;
  }

  offset(count: number): SelectQuery {
    this.params.push(count);
    this.offsetClause = `OFFSET $${this.params.length}`;
    return this;
  }

  build(): { query: string; params: any[] } {
    let query = `SELECT ${this.columns.join(', ')} FROM ${this.table}`;

    if (this.whereConditions.length > 0) {
      query += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }

    if (this.orderByClause) {
      query += ` ${this.orderByClause}`;
    }

    if (this.limitClause) {
      query += ` ${this.limitClause}`;
    }

    if (this.offsetClause) {
      query += ` ${this.offsetClause}`;
    }

    return { query, params: this.params };
  }
}

class InsertQuery {
  private table: string;
  private data: Record<string, any> = {};
  private returningColumns: string[] = [];

  constructor(table: string) {
    this.table = table;
  }

  values(data: Record<string, any>): InsertQuery {
    this.data = { ...this.data, ...data };
    return this;
  }

  returning(columns: string[]): InsertQuery {
    this.returningColumns = columns;
    return this;
  }

  build(): { query: string; params: any[] } {
    const columns = Object.keys(this.data);
    const values = Object.values(this.data);
    const placeholders = columns.map((_, index) => `$${index + 1}`);

    let query = `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;

    if (this.returningColumns.length > 0) {
      query += ` RETURNING ${this.returningColumns.join(', ')}`;
    }

    return { query, params: values };
  }
}

class UpdateQuery {
  private table: string;
  private data: Record<string, any> = {};
  private whereConditions: string[] = [];
  private params: any[] = [];
  private returningColumns: string[] = [];

  constructor(table: string) {
    this.table = table;
  }

  set(data: Record<string, any>): UpdateQuery {
    this.data = { ...this.data, ...data };
    return this;
  }

  where(condition: string, value?: any): UpdateQuery {
    if (value !== undefined) {
      this.params.push(value);
      this.whereConditions.push(`${condition} = $${this.params.length}`);
    } else {
      this.whereConditions.push(condition);
    }
    return this;
  }

  returning(columns: string[]): UpdateQuery {
    this.returningColumns = columns;
    return this;
  }

  build(): { query: string; params: any[] } {
    const setColumns = Object.keys(this.data);
    const setValues = Object.values(this.data);

    // Add SET values to params first
    const setClause = setColumns.map((column, index) => {
      return `${column} = $${index + 1}`;
    }).join(', ');

    // Adjust WHERE condition parameter numbers
    const adjustedWhereConditions = this.whereConditions.map(condition => {
      return condition.replace(/\$(\d+)/g, (match, num) => {
        return `$${parseInt(num) + setColumns.length}`;
      });
    });

    let query = `UPDATE ${this.table} SET ${setClause}`;

    if (adjustedWhereConditions.length > 0) {
      query += ` WHERE ${adjustedWhereConditions.join(' AND ')}`;
    }

    if (this.returningColumns.length > 0) {
      query += ` RETURNING ${this.returningColumns.join(', ')}`;
    }

    return { query, params: [...setValues, ...this.params] };
  }
}

class DeleteQuery {
  private table: string;
  private whereConditions: string[] = [];
  private params: any[] = [];
  private returningColumns: string[] = [];

  constructor(table: string) {
    this.table = table;
  }

  where(condition: string, value?: any): DeleteQuery {
    if (value !== undefined) {
      this.params.push(value);
      this.whereConditions.push(`${condition} = $${this.params.length}`);
    } else {
      this.whereConditions.push(condition);
    }
    return this;
  }

  returning(columns: string[]): DeleteQuery {
    this.returningColumns = columns;
    return this;
  }

  build(): { query: string; params: any[] } {
    let query = `DELETE FROM ${this.table}`;

    if (this.whereConditions.length > 0) {
      query += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }

    if (this.returningColumns.length > 0) {
      query += ` RETURNING ${this.returningColumns.join(', ')}`;
    }

    return { query, params: this.params };
  }
}

export { SelectQuery, InsertQuery, UpdateQuery, DeleteQuery };
