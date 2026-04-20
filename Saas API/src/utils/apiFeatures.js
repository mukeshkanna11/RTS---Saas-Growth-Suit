class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const exclude = ["page", "limit", "sort", "search"];
    exclude.forEach(el => delete queryObj[el]);

    this.query = this.query.find(queryObj);
    return this;
  }

  search(fields) {
    if (this.queryString.search) {
      const keyword = {
        $or: fields.map(field => ({
          [field]: { $regex: this.queryString.search, $options: "i" }
        }))
      };
      this.query = this.query.find(keyword);
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = ApiFeatures;