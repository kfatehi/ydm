module.exports = function Gitlab(scope) {
  this.install = function () {
    console.log("install");
    console.log(scope);
  }
}
