class ApiResponse {
    constructor(statusCode, message = "Success", data = '', error = []) {
        this.statusCode = statusCode
        this.message = message
        this.data = data
        this.error = error
        this.success = statusCode < 400
    }
}

module.exports = { ApiResponse };