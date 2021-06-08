(function($) {
    $(document).ready(function() {

        //tworzenie i usuwanie okna modalnego z komunikatem
        function ModalWindow() {
            var scroll = 0;
            $(window).scroll(function() {
                scroll = $(this).scrollTop();
            });
            $(window).scroll();

            var $background_modal_window = $('#background_modal_window');
            var $modal_window = $background_modal_window.find('.modal_window');
            var distance_from_top = 50;
            var min_distance_from_bottom = 50;

            function set_dimensions_background_modal_window_first_step() {
                var $html = $('html');
                var html_width = $html.width();
                var html_height = $html.height();
                var window_width = $(window).width();
                var window_height = $(window).height();
                if (html_height > window_height) {
                    window_height = html_height;
                }
                if (html_width < window_width) {
                    window_width = html_width;
                }
                $background_modal_window.css({
                    width: window_width + 'px',
                    height: window_height + 'px'
                });
                return window_height;
            }

            function set_position_modal_window(window_height, distance_from_top, min_distance_from_bottom) {
                var height_modal_window = $modal_window.innerHeight();
                var scroll_now = scroll;
                var $header = $('header#header');
                if ($header.css('position') === 'fixed') {
                    scroll_now += $header.innerHeight();
                }
                scroll_now += distance_from_top;
                var height_modal_window_with_margin_top = height_modal_window + scroll_now + min_distance_from_bottom;
                if (window_height < height_modal_window_with_margin_top) {
                    $background_modal_window.css('height', height_modal_window_with_margin_top + 'px');
                }
                $modal_window.css('top', scroll_now + 'px');
            }

            this.show = function(html, randomClasses) {
                var window_height = set_dimensions_background_modal_window_first_step();
                $background_modal_window.find('.content_modal_window').html(html);
                if (Array.isArray(randomClasses)) {
                    var amountRandomClasses = randomClasses.length;
                    var randomIndex = Math.floor((Math.random() * amountRandomClasses));
                    var randomClass = randomClasses[randomIndex];
                    $modal_window.addClass(randomClass);
                }
                $background_modal_window.show();
                set_position_modal_window(window_height, distance_from_top, min_distance_from_bottom);
            };

            $background_modal_window.on('click', '.modal_window .ok_button', function() {
                $background_modal_window.hide();
            });

            $(window).resize(function() {
                var window_height = set_dimensions_background_modal_window_first_step();
                if ($modal_window.is(':visible')) {
                    set_position_modal_window(window_height, distance_from_top, min_distance_from_bottom);
                }
            });
            $(window).resize();
        }

        var modalWindow = new ModalWindow();

        function showModalWindowWithContentFromAddon(addonName, actionElement, ajaxLoaderElement) {
            actionElement.hide();
            ajaxLoaderElement.show();
            $.ajax({
                url: ajax_options.admin_ajax_url,
                type: 'POST',
                dataType: 'text',
                data: {
                    action: addonName
                },
                success: function(data) {
                    actionElement.show();
                    ajaxLoaderElement.hide();
                    modalWindow.show(data);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    actionElement.show();
                    ajaxLoaderElement.hide();
                    console.log(jqXHR);
                    console.log(textStatus);
                    console.log(errorThrown);
                }
            });
        }

        //kopiuj i podmień nazwę id dla przycisku, nazwy dodatku, id ajax loader
        $('body').on('click', '#addon1', function() {
            showModalWindowWithContentFromAddon('addon1', $(this), $('#addon1_ajax_loader'));
        });
        //koniec kopiowania

        //kopiuj dla każdego przycisku w formularzu
        $('body').on('submit', '#addon1form', function(event) {
            event.preventDefault();
            var $addon1db = $('#addon1db');
            var $addon1submit = $('#addon1submit');
            var $addon1form_ajax_loader = $('#addon1form_ajax_loader');
            var $addon1_result_message = $('#addon1_result_message');
            $addon1submit.hide();
            $addon1form_ajax_loader.show();
            $addon1_result_message.text('');
            $.ajax({
                url: ajax_options.admin_ajax_url,
                type: 'POST',
                dataType: 'text',
                data: {
                    action: 'addon1form',
                    addon1db: $addon1db.val()
                },
                success: function(data) {
                    $addon1submit.show();
                    $addon1form_ajax_loader.hide();
                    if (data === 'ok') {
                        $addon1_result_message.text('Zapisano dane do bazy');
                    } else {
                        $addon1_result_message.text('Nie udało się zapisać danych do bazy');
                        console.log(data);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    $addon1submit.show();
                    $addon1form_ajax_loader.hide();
                    $addon1_result_message.text('Nie udało się zapisać danych do bazy');
                    console.log(jqXHR);
                    console.log(textStatus);
                    console.log(errorThrown);
                }
            });
        });
        //koniec kopiowania





    });
})(jQuery);