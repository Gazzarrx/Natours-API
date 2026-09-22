class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    };
    filter() {
        // (1B) BUILD A QUERY FILTER
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);

        // (2B) ADVANCED QUERY FILTER
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr));
        // let query = Tour.find(JSON.parse(queryStr));
        return this;
    };
    sort() {
        // (3B) SORTING QUERIES
        if (this.queryString.sort) {
            console.log(this.queryString.sort);
            const sortBy = this.queryString.sort.split(',').join(' ');
            // console.log(sortBy);
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }
        return this;
    };
    fieldsLimit() {
        //  (4B) FIELDS lIMIT
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            // console.log(fields);
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        };
        return this;
    };
    paginate() {
        // PAGINATION
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);
        // if (this.queryString.page) {
        //     const numTours = await this.query.countDocuments();
        //     if (skip >= numTours) throw new Error('The page does not exist');
        // };
        return this;
    };
};
module.exports = APIFeatures;