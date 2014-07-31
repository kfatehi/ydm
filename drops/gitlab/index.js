module.exports = function Gitlab(scope) {
  this.image = "sameersbn/gitlab:7:1:0"
  this.install = function () {
    console.log("install");
    console.log(scope);
  }
}
