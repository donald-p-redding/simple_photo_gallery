'use strict';

$(function()  {
  let allPhotos;
  let currentPhotoIdx;

  let $photos = $('#photos');
  let $photo_information = $('#photo_information');
  let $photo_comments = $('#photo_comments');
  let $photo_comment = $('#photo_comment');

  $photos.remove();
  $photo_information.remove();
  $photo_comments.remove();
  $photo_comment.remove();

  const PHOTO_TEMP = Handlebars.compile($photos.html())
  const PHOTO_INFO_TEMP = Handlebars.compile($photo_information.html());
  const PHOTO_COMMENTS_TEMP = Handlebars.compile($photo_comments.html());
  const PHOTO_COMMENT_TEMP = Handlebars.compile($photo_comment.html());
  Handlebars.registerPartial('photo_comment', $photo_comment.html());

  const fetchPhotos = function() {
    $.ajax( {
      url: '/photos',
      type: 'GET',
      dataType: 'json',
    }).done(json => {
      allPhotos = json;
      currentPhotoIdx = 0;

      renderSlides(json);
      renderPhotoInfo();
      updateComments();
    });
  };

  function updateLikes(id) {
    $.ajax({
      url: '/photos/like',
      type: 'POST',
      data: {photo_id: id},
      dataType: 'json',
    }).done(json => {
      allPhotos[currentPhotoIdx].likes += 1;
      let oldText = $('.like').text();
      let newText = oldText.replace(/\d+/g, json.total);
      $('.like').text(newText);
    });
  }

  function updateFaves(id) {
    $.ajax({
      url: '/photos/favorite',
      type: 'POST',
      data: {photo_id: id},
      dataType: 'json',
    }).done(json => {
      allPhotos[currentPhotoIdx].favorites += 1;
      let oldText = $('.favorite').text();
      let newText = oldText.replace(/\d+/g, json.total);
      $('.favorite').text(newText);
    });
  }

  function bindButtons() {
    $('a.button').on('click', function(e) {
      e.preventDefault();

      if($(this).hasClass('like')) {
        updateLikes($(this).attr('data-id'));
      } else if($(this).hasClass('favorite')) {
        updateFaves($(this).attr('data-id'));
      }
    });
  }

  function renderSlides(json) {
    let slideshow = PHOTO_TEMP({ photos: json });
    $('#slides').html(slideshow);
  }

  function updateComments() {
    let $currentPhoto = $('#slides figure:visible');
    $.ajax({
      url: `/comments?photo_id=${$currentPhoto.attr('data-id')}`,
      type: 'GET',
      dataType: 'json',
    }).done(comments => {
      $('#comments ul').html(PHOTO_COMMENTS_TEMP({comments}));
    });
  }

  function renderPhotoInfo() {
    let photoData = allPhotos[currentPhotoIdx];

    $('section > header').html(PHOTO_INFO_TEMP(photoData));
    bindButtons();
  }

  function resetForm() {
    $('form').trigger('reset');
  }

  $('.prev').on('click', function(e) {
    e.preventDefault();
    let $currentPhoto = $('#slides figure:visible');

    if(currentPhotoIdx <= 0) return;

    let $nextPhoto = $currentPhoto.prev();

    $currentPhoto.fadeOut(400);
    $nextPhoto.fadeIn(400, function() {
      currentPhotoIdx -= 1;
      updateComments();
      renderPhotoInfo();
      resetForm();
    });

  });

  $('.next').on('click', e => {
    e.preventDefault();
    let $currentPhoto = $('#slides figure:visible');

    if(currentPhotoIdx >= allPhotos.length - 1) return;

    let $nextPhoto = $currentPhoto.next();

    $currentPhoto.fadeOut(400);
    $nextPhoto.fadeIn(400, function() {
      currentPhotoIdx += 1;
      updateComments();
      renderPhotoInfo();
      resetForm();
    });


  });

  $('form').on('submit', function(e) {
    e.preventDefault();
    let $form = $(this);
    let name = $form.find('#name').val();
    let email = $form.find('#email').val();
    let body = $form.find('#body').val();
    let photo_id = $('#slideshow figure:visible').attr('data-id');

    $.ajax({
      url: '/comments/new',
      type: 'post',
      dataType: 'json',
      data: {name, email, body, photo_id},
    }).done(json => {
      let newComment = PHOTO_COMMENT_TEMP(json);
      $('#comments ul').append(newComment);
      resetForm();
    });
  });

  fetchPhotos();  
});