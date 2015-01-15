//= require_tree .

var toggleAbout = function(ev) {
  $('.about-overlay').toggleClass('open');
  $('body').toggleClass('about-open');
};

var showCaptions = function () {
  var caption;
  $('img').each(function () {
    caption = $(this).attr('alt');
    if (caption !== undefined && caption !== '')
      // use .before to insert the caption before the image
      $(this).after('<caption>' + caption + '</caption>');
  });
}

$(document).ready(function(){
  $(document).on('click', '.about-link', toggleAbout);
  $(document).on('click', '.about-close', toggleAbout);
  $(document).on('click', '.about-mobile', toggleAbout);
  showCaptions();
});
