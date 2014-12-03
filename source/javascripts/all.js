//= require_tree .

var toggleAbout = function(ev) {
  $('.about-overlay').toggleClass('open');
  $('body').toggleClass('about-open');
};

$(document).ready(function(){
  $(document).on('click', '.about-link', toggleAbout);
  $(document).on('click', '.about-close', toggleAbout);
  $(document).on('click', '.about-mobile', toggleAbout);
});
