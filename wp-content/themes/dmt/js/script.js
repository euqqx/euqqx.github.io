(function($) {
    $(document).ready(function() {
        var currency = 'PLN';
        var widthPage;


        var kurs_dopelniacz = 'kursu';
        var kurs_dopelniacz_mnoga = 'kursów';
        var lekcja_biernik = 'lekcję';


        //        var $background_addons_products = $('.background_addons_products');        

        //userAgent in IE7 WinXP returns: Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; .NET CLR 2.0.50727)
        //userAgent in IE11 Win7 returns: Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko

        if (navigator.userAgent.indexOf('MSIE') != -1)
            var detectIEregexp = /MSIE (\d+\.\d+);/ //test for MSIE x.x
        else // if no "MSIE" string in userAgent
            var detectIEregexp = /Trident.*rv[ :]*(\d+\.\d+)/ //test for rv:x.x or rv x.x where Trident string exists

        if (detectIEregexp.test(navigator.userAgent)) { //if some form of IE
            $('body').addClass('ie');
        }

        function validateEmail(email) {
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }

        //For checking if a string is blank or contains only white-space
        String.prototype.isEmpty = function() {
            return (this.length === 0 || !this.trim());
        };

        //tworzenie i usuwanie okna modalnego z komunikatem
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
            if ($header.css('position') == 'fixed') {
                scroll_now += $header.innerHeight();
            }
            scroll_now += distance_from_top;
            var height_modal_window_with_margin_top = height_modal_window + scroll_now + min_distance_from_bottom;
            if (window_height < height_modal_window_with_margin_top) {
                $background_modal_window.css('height', height_modal_window_with_margin_top + 'px');
            }
            $modal_window.css('top', scroll_now + 'px');
        }

        function show_modal_window(html) {
            var window_height = set_dimensions_background_modal_window_first_step();
            $background_modal_window.find('.content_modal_window').html(html);
            $background_modal_window.show();
            set_position_modal_window(window_height, distance_from_top, min_distance_from_bottom);
        }

        $background_modal_window.on('click', '.modal_window .ok_button', function() {
            $background_modal_window.hide();
        });

        var $upsell_products = $('#upsell_products');

        var $price = $('.price');
        $price.each(function() {
            var $this = $(this);
            var ins = $this.children('ins');
            if (ins.length > 0) {
                var amount = ins.children('.amount');
                if (ins.text() === 'Za darmo!') {
                    ins.text('');
                    ins.append('<span class="amount">0' + currency + '</span>');
                }
            } else {
                var amount = $this.children('.amount');
                if (amount.text() === 'Za darmo!') {
                    amount.text('0' + currency);
                }
            }
        });

        //jeśli sidebar z listą kategorii jest wyższa niż kontener na treść, to zwiększ wysokość tego kontenera do wysokości sidebar
        var $category_products = $('#category_products');
        var $content = $('#content');
        var height_category_products = $category_products.innerHeight() + parseInt($category_products.css('borderTop')) + parseInt($category_products.css('borderBottom'));
        var height_content = $content.innerHeight() + parseInt($content.css('borderTop')) + parseInt($content.css('borderBottom'));

        if (height_category_products > height_content) {
            var height_now = height_content + (height_category_products - height_content);
            $content.css('height', height_now + 'px');
        }

        $('body').on('click', '.add_products_to_cart', function() {
            var $this = $(this);
            var this_id = $this.attr('id');
            var id = this_id.substring(this_id.lastIndexOf('_') + 1);

            var course_mode = $this.prev('.course_mode').val();

            var $cart_menu = $('#cart_menu');
            var checked = $('.products_to_add_' + id + ':checked:not(:disabled)');
            var id_products_to_add = Array();
            var $ajax_loader = $this.parent().next('.ajax_loader_right');
            var $cart_message = $ajax_loader.next('.cart_message');

            var $addon_li = $('#addons_products_' + id);

            var addons = 'no';
            if ($this.hasClass('addons')) {
                addons = 'yes';
            }

            $cart_message.text('');
            $cart_message.hide();
            if (checked.length > 0) {
                checked.each(function() {
                    var $this_ch = $(this);
                    id_products_to_add.push($this_ch.val());
                });
                //                $this.prop('disabled', true);    
                $this.hide();
                $ajax_loader.show();

                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        id_products_to_add: id_products_to_add,
                        course_mode: course_mode
                    },
                    success: function(data) {
                        var products_in_cart = {};
                        var count_products_in_cart = 0;
                        //                        reload_relocation_columns();

                        for (var key in data) {
                            //                            console.log('key = '+key);
                            //                            console.log('data[key] = '+data[key]);
                            if (key > 0) {
                                products_in_cart[key] = data[key];
                            }
                        }
                        for (var key in products_in_cart) {
                            if (products_in_cart[key] !== false) {
                                checked.each(function() {
                                    var $this = $(this);
                                    if ($this.val() === key) {
                                        $this.prop('disabled', true);
                                        count_products_in_cart++;
                                    }
                                });
                            }
                        }

                        $cart_menu.children('span').text(data[0]);

                        if (count_products_in_cart > 0) {
                            if (addons === 'no') {
                                if ($addon_li.length > 0) {
                                    var $all_li_addon = $addon_li.find('li');
                                    $all_li_addon.hide();
                                    if (data[-1]) {
                                        for (var key in data[-1]) {
                                            //                                        console.log('key = '+key);
                                            //                                        console.log('data[-1][key] = '+data[-1][key]);
                                            var $li_now = $addon_li.find('.post-' + data[-1][key]);
                                            $li_now.show();
                                            var $checkbox_now = $li_now.children('input[type="checkbox"]');
                                            $checkbox_now.prop('disabled', false);
                                            $checkbox_now.prop('checked', false);
                                            var $check_all_now = $addon_li.find('.check_all');
                                            var $checkbox_all = $addon_li.find('input[type="checkbox"]');
                                            var is_show_check_all = false;
                                            $checkbox_all.each(function() {
                                                var $this_ch_all = $(this);
                                                if (!($this_ch_all.parent().css('display') === 'none')) {
                                                    is_show_check_all = true;
                                                    return false;
                                                }
                                            });
                                            if (is_show_check_all) {
                                                $check_all_now.show();
                                                $li_now.siblings('.sum_check_products').show();
                                                $li_now.siblings('.button_cart').show();
                                            }

                                        }
                                    }
                                    var is_show_addon_li = false;
                                    $all_li_addon.each(function() {
                                        var $this_li_addon_temp = $(this);
                                        if (!($this_li_addon_temp.css('display') === 'none')) {
                                            is_show_addon_li = true;
                                            return false;
                                        }
                                    });
                                    if (is_show_addon_li) {
                                        $addon_li.show();
                                    }

                                    var is_hide = true;
                                    $upsell_products.find('li').each(function() {
                                        var $this_upsell_li = $(this);
                                        if (!($this_upsell_li.css('display') === 'none')) {
                                            is_hide = false;
                                            return false;
                                        }
                                    });
                                    if (!is_hide) {
                                        $upsell_products.show();
                                    }
                                }
                            }
                        }

                        $cart_message.text('Ilość produktów dodanych do koszyka: ' + count_products_in_cart);
                        $cart_message.show();
                        //                        $this.prop('disabled', false);
                        $this.show();
                        $ajax_loader.hide();

                        if (count_products_in_cart > 0) {
                            window.location.href = $('#zamowienie_url').text();
                        }


                        //                        render_background_addons($background_addons_products, widthPage);   
                        //                        $(window).resize();

                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        $cart_message.text('Coś poszło nie tak. Dodaj produkty do koszyka ponownie. Jeśli komunikat się powtarza, to napisz do nas o swoim problemie na stronie Kontakt. Dziękujęmy!');
                        $cart_message.show();
                        //                        $this.prop('disabled', false);
                        $this.show();
                        $ajax_loader.hide();
                    }
                });
            }
            return false;
        });

        $('.add_single_product_to_cart').click(function() {
            var $this = $(this);
            var id_product_to_add = $this.attr('href');

            var course_mode = $this.prevAll('.course_mode').val();
            //            var course_mode = 1;

            var $cart_menu = $('#cart_menu');
            //            var $ajax_loader = $this.parent().siblings('.ajax_loader_right'); 
            //            var $cart_message = $this.parent().siblings('.cart_message');
            var $addon_li = $('#addons_products_' + id_product_to_add);
            //            var $choose_mode = $('#choose_mode_'+id_product_to_add);

            var addons = 'no';
            if ($this.hasClass('addons')) {
                addons = 'yes';
            }

            var $buttons_cart = $('.add_single_product_to_cart[href="' + id_product_to_add + '"]');

            //            $cart_message.text('');
            //            $cart_message.hide();

            //            $buttons_cart.prop('disabled', true);    
            //            $buttons_cart.parent().hide();
            //            $ajax_loader.show();



            $.ajax({
                type: 'POST',
                dataType: 'json',
                data: {
                    id_product_to_add: id_product_to_add,
                    addons: addons,
                    course_mode: course_mode
                },
                success: function(data) {
                    //                    var count_products_in_cart = 0;
                    //                    $buttons_cart.parent().show();


                    for (var key in data) {
                        //                        console.log('key = '+key);
                        //                        console.log('data[key] = '+data[key]);
                        if (key <= 0) {
                            if (data[key] !== false) {
                                //                                $buttons_cart.parent().css('visibility', 'hidden');
                                //                                $this.parent().hide();

                                //                                $buttons_cart.children('a').remove();
                                //                                $buttons_cart.prepend()
                                //                                addClass('unactive');
                                //                                $buttons_cart.each(function(){
                                //                                    $(this).prop('disabled', true);    
                                //                                });
                                window.location.href = $('#zamowienie_url').text();

                                //                                $buttons_cart.after('<span class="button unactive">Dodaj do koszyka</a>');   
                                //                                $buttons_cart.remove();
                                //                                count_products_in_cart++;   
                                break;
                            }

                        }
                    }

                    //                    $cart_menu.children('span').text(data[0]);
                    //
                    //                    if(count_products_in_cart > 0){ 
                    //                        if(addons === 'no'){
                    //                            if($addon_li.length > 0){
                    //                                var $all_li_addon = $addon_li.find('li');
                    //                                $all_li_addon.hide();
                    //                                if(data[-1]){
                    //                                    for(var key in data[-1]){
                    //    //                                    console.log('key = '+key);
                    //    //                                    console.log('data[-1][key] = '+data[-1][key]);
                    //                                        var $li_now = $addon_li.find('.post-'+data[-1][key]);
                    //                                        $li_now.show();
                    //                                        var $checkbox_now = $li_now.children('input[type="checkbox"]');
                    //                                        $checkbox_now.prop('disabled', false);
                    //                                        $checkbox_now.prop('checked', false);
                    //                                        var $check_all_now = $addon_li.find('.check_all');
                    //                                        var $checkbox_all = $addon_li.find('input[type="checkbox"]');
                    //                                        var is_show_check_all = false;
                    //                                        $checkbox_all.each(function(){
                    //                                            var $this_ch_all = $(this);
                    //                                            if(!($this_ch_all.parent().css('display') === 'none')){
                    //                                                is_show_check_all = true;
                    //                                                return false;
                    //                                            }
                    //                                        });
                    //                                        if(is_show_check_all){
                    //                                            $check_all_now.show();
                    //                                            $li_now.siblings('.sum_check_products').show();
                    //                                            $li_now.siblings('.button_cart').show();
                    //                                        }                                       
                    //
                    //                                    }
                    //                                }
                    //                                var is_show_addon_li = false;
                    //                                $all_li_addon.each(function(){
                    //                                    var $this_li_addon_temp = $(this);
                    //                                    if(!($this_li_addon_temp.css('display') === 'none')){
                    //                                        is_show_addon_li = true;
                    //                                        return false;
                    //                                    }
                    //                                });
                    //                                if(is_show_addon_li){
                    //                                    $addon_li.show(); 
                    //                                }
                    //
                    //                                var is_hide = true;            
                    //                                $upsell_products.find('li').each(function(){
                    //                                    var $this_upsell_li = $(this);
                    //                                    if(!($this_upsell_li.css('display') === 'none')){
                    //                                        is_hide = false;
                    //                                        return false;
                    //                                    }
                    //                                });            
                    //                                if(!is_hide){
                    //                                    $upsell_products.show();
                    //                                }  
                    //                                
                    //                                if(data[-2]){
                    //                                    var items = $('input[type="checkbox"]');
                    //                                    for(var key in data[-2]){
                    ////                                        console.log(data[-2][key]);
                    //                                        items.each(function(){
                    //                                            var $this_temp = $(this);
                    //                                            if($this_temp.val() == data[-2][key]){
                    //                                                $this_temp.prop('checked', true);
                    //                                                $this_temp.prop('disabled', true);
                    //                                                $this_temp.parent().hide();                                         
                    //                                            }
                    //                                        });
                    //                                    }
                    //                                }
                    //                            }                            
                    //                        }                        
                    //                    }

                    //                    $cart_message.text('Ilość produktów dodanych do koszyka: ' + count_products_in_cart);
                    //                    $cart_message.show();
                    //                    $buttons_cart.prop('disabled', false);

                    //                    $ajax_loader.hide();     
                    //                    $(window).resize();

                    //przkierowanie do innego produktu - stary Upsell
                    //                    if(data[-1]){
                    //                        window.setTimeout(function(){
                    //                            window.location.href = data[-1];
                    //                        }, 1000);
                    //                    }
                    //                    $choose_mode.show();
                    //                    reload_relocation_columns();   
                    //                    render_background_addons($background_addons_products, widthPage); 

                    //                    var top_choose_mode = $choose_mode.offset().top+'px';
                    //                    $('html, body').animate({scrollTop: top_choose_mode}, 500);


                },
                error: function(jqXHR, textStatus, errorThrown) {
                    //                    $cart_message.text('Coś poszło nie tak. Dodaj produkt do koszyka ponownie. Jeśli komunikat się powtarza, to napisz do nas o swoim problemie na stronie Kontakt. Dziękujęmy!');
                    //                    $cart_message.show();
                    //                    $buttons_cart.prop('disabled', false);
                    //                    $buttons_cart.parent().show();
                    //                    $ajax_loader.hide();
                }
            });

            return false;
        });

        //zmiana trybu po dodaniu do koszyka        
        $('.change_mode_course').click(function() {
            var $this = $(this);
            var id_product_to_add = $this.attr('href');

            var course_mode = $this.prev('.course_mode').val();

            var $ajax_loader = $this.next('.ajax_loader_right');
            var $client_message = $this.parent().parent().siblings('.client_message');
            var cart_href = $('#cart_menu').attr('href');

            $client_message.text('');
            $client_message.hide();

            $this.hide();
            $ajax_loader.show();


            $.ajax({
                type: 'POST',
                dataType: 'text',
                data: {
                    id_product_change_mode: id_product_to_add,
                    course_mode: course_mode
                },
                success: function(data) {
                    if (data === 'success') {
                        $client_message.html('Zmieniono tryb dla tego zamówionego kursu. <a href="' + cart_href + '">Przejdź do koszyka</a>, aby sfinalizować zamówienie lub kontynuuj zakupy.');
                        var products_instant = [];
                        var $data_lessons_instant = $this.attr('data-lessons-instant');

                        if ($data_lessons_instant != undefined) {
                            var array_id_lessons = $data_lessons_instant.split(",").map(Number);
                            for (var i = 0; i < array_id_lessons.length; i++) {
                                products_instant.push($('[data-instant-parent=' + array_id_lessons[i] + ']'));
                            }
                        } else {
                            products_instant.push($('[data-instant-parent=' + id_product_to_add + ']'));
                        }
                        if (course_mode > 0) {
                            for (var i = 0; i < products_instant.length; ++i) {
                                products_instant[i].prop('checked', false);
                                products_instant[i].prop('disabled', false);
                                products_instant[i].parent().show();
                            }
                        } else {
                            for (var i = 0; i < products_instant.length; ++i) {
                                products_instant[i].prop('checked', true);
                                products_instant[i].prop('disabled', true);
                                products_instant[i].parent().hide();
                            }
                        }
                    } else if (data === 'wrong_number') {
                        $client_message.text('Nie zmieniono tryb dla tego zamówionego ' + kurs_dopelniacz + '. ID produktu jest nieprawidłowe.');
                    } else {
                        $client_message.text('Nie zmieniono tryb dla tego zamówionego ' + kurs_dopelniacz + '. Spróbuj zmienić tryb ponownie. Jeśli problem się powtarza, to napisz do nas o tym problemie na stronie Kontakt.');
                    }

                    $client_message.show();
                    $ajax_loader.hide();
                    $this.show();
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    $client_message.text('Nie zmieniono tryb dla tego zamówionego ' + kurs_dopelniacz + '. Spróbuj zmienić tryb ponownie. Jeśli problem się powtarza, to napisz do nas o tym problemie na stronie Kontakt.');
                    $client_message.show();
                    $ajax_loader.hide();
                    $this.show();
                }
            });

            return false;
        });






        function check_all($check_button, $check_fields) {
            $check_fields.each(function() {
                var $this = $(this);
                if ($check_button.is(':checked') && $this.is(':not(:checked)')) {
                    $this.prop('checked', true);
                    $this.change();
                } else {
                    if ($check_button.is(':not(:checked)') && $this.is(':checked')) {
                        $this.prop('checked', false);
                        $this.change();
                    }
                }

            });
        }
        //var $check_all_products = $('.check_all_products');        

        $('body').on('change', '.check_all_products', function() {
            var $this = $(this);
            var this_id = $this.attr('id');
            var id = this_id.substring(this_id.lastIndexOf('_') + 1);
            var $check_fields_products = $('.products_to_add_' + id + ':not(:disabled)');
            check_all($this, $check_fields_products);
        });

        //        var $check_all_products_upsell = $('#check_all_products_upsell');       
        //        
        //        $check_all_products_upsell.change(function(){
        //            var $this = $(this);
        //            var $check_fields_products_upsell = $('.products_to_add.upsell_product:not(:disabled)');
        //            check_all($this, $check_fields_products_upsell);
        //        });




        function sum_on_start($sum_result) {
            $sum_result.each(function() {
                var sum = 0;
                var $this_sum = $(this);
                var this_id = $this_sum.attr('id');
                var id = this_id.substring(this_id.lastIndexOf('_') + 1);
                var $check_fields = $('.products_to_add_' + id + ':checked:not(:disabled)');
                $check_fields.each(function() {
                    var $this = $(this);
                    var $have_it_text = $this.siblings('.have_it');
                    if (!($have_it_text && $have_it_text.length > 0)) {
                        var price = parseFloat($this.siblings('.price').children('.amount').text());
                        if (isNaN(price)) {
                            price = parseFloat($this.siblings('.price').children('ins').children('.amount').text());
                        }
                        sum += price;
                    }
                });
                $this_sum.children('span').text(sum.toFixed(2));
            });

        }

        sum_on_start($('.sum_check_products'));

        function change_sum($check_field, $sum_result) {
            var sum = parseFloat($sum_result.children('span').text());
            var price = parseFloat($check_field.siblings('.price').children('.amount').text());
            if (isNaN(price)) {
                price = parseFloat($check_field.siblings('.price').children('ins').children('.amount').text());
            }
            if ($check_field.is(':checked')) {
                var $course_mode = $sum_result.next('.button_cart').children('.course_mode');
                if ($course_mode && $course_mode.val() == 0) {
                    var $price_instant_element = $('[data-instant-parent="' + $check_field.val() + '"][data-instant-kind="lekcja"]').first();
                    var price_instant_temp = 0;
                    if ($price_instant_element && $price_instant_element.length > 0) {
                        var $price_tag_temp = $price_instant_element.siblings('.price');

                        var $amount_regular_price_temp = $price_tag_temp.children('.amount');
                        if ($amount_regular_price_temp && $amount_regular_price_temp.length < 1) {
                            var $amount_promotion_price_temp = $price_tag_temp.children('ins').children('.amount');
                        }
                        price_instant_temp = parseFloat($amount_regular_price_temp.text());
                        if ($amount_promotion_price_temp && $amount_promotion_price_temp.length > 0) {
                            price_instant_temp = parseFloat($amount_promotion_price_temp.text());
                        }
                    }
                    sum += price + price_instant_temp;
                } else {
                    sum += price;
                }
            } else {
                var $course_mode = $sum_result.next('.button_cart').children('.course_mode');
                if ($course_mode && $course_mode.val() == 0) {
                    var $price_instant_element = $('[data-instant-parent="' + $check_field.val() + '"][data-instant-kind="lekcja"]').first();
                    var price_instant_temp = 0;
                    if ($price_instant_element && $price_instant_element.length > 0) {
                        var $price_tag_temp = $price_instant_element.siblings('.price');

                        var $amount_regular_price_temp = $price_tag_temp.children('.amount');
                        if ($amount_regular_price_temp && $amount_regular_price_temp.length < 1) {
                            var $amount_promotion_price_temp = $price_tag_temp.children('ins').children('.amount');
                        }
                        price_instant_temp = parseFloat($amount_regular_price_temp.text());
                        if ($amount_promotion_price_temp && $amount_promotion_price_temp.length > 0) {
                            price_instant_temp = parseFloat($amount_promotion_price_temp.text());
                        }
                    }
                    sum -= (price + price_instant_temp);
                } else {
                    sum -= price;
                }
            }
            $sum_result.children('span').text(sum.toFixed(2));
        }

        $('body').on('change', 'input[data-kind="products_to_add"]', function() {
            var $this = $(this);
            var this_id = $this.attr('class');
            var id = this_id.substring(this_id.lastIndexOf('_') + 1);
            var $sum_check_products = $('#sum_check_products_' + id);
            change_sum($this, $sum_check_products);
        });

        var id_lessons_prices = {};

        $('body').on('change', '.course_mode', function() {
            var $this = $(this);
            //            console.log($this);
            if ($this.next().hasClass('add_products_to_cart')) {
                var $sum_check_products = $this.parent().prev('.sum_check_products');
                var this_id = $sum_check_products.attr('id');
                var id = this_id.substring(this_id.lastIndexOf('_') + 1);
                var $checkbox_lessons = $('.products_to_add_' + id + ':checked:not(:disabled)');
                var sum = 0;
                $checkbox_lessons.each(function() {
                    var $this_checkbox = $(this);
                    var price = parseFloat($this_checkbox.siblings('.price').children('.amount').text());
                    if (isNaN(price)) {
                        price = parseFloat($this_checkbox.siblings('.price').children('ins').children('.amount').text());
                    }
                    if ($this.val() == 0) {
                        var $price_instant_element = $('[data-instant-parent="' + $this_checkbox.val() + '"][data-instant-kind="lekcja"]').first();
                        var price_instant_temp = 0;
                        if ($price_instant_element && $price_instant_element.length > 0) {
                            var $price_tag_temp = $price_instant_element.siblings('.price');

                            var $amount_regular_price_temp = $price_tag_temp.children('.amount');
                            if ($amount_regular_price_temp && $amount_regular_price_temp.length < 1) {
                                var $amount_promotion_price_temp = $price_tag_temp.children('ins').children('.amount');
                            }

                            price_instant_temp = parseFloat($amount_regular_price_temp.text());

                            if ($amount_promotion_price_temp && $amount_promotion_price_temp.length > 0) {
                                price_instant_temp = parseFloat($amount_promotion_price_temp.text());
                            }

                        }

                        sum += price + price_instant_temp;
                    } else {
                        sum += price;
                    }
                });

                $sum_check_products.children('span').text(sum.toFixed(2));
            }
            //w dodatkach zmiana trybu na liście, a potem dodanie do koszyka - teraz ta lista wyłączona, więc ten kod się nie wykona
            else if ($this.next().hasClass('add_single_product_to_cart')) {
                var data_lessons_instant = $this.next().attr('data-lessons-instant');
                if (data_lessons_instant != undefined) {
                    //zmienić liczby po przecinku w tablicę i sprawdzić czy w tablicy są same liczby całkowite od 1
                    var array_id_lessons = data_lessons_instant.split(",").map(Number);
                    var is_numbers_lesson = true;
                    var pattern = /^[1-9][0-9]*$/;
                    for (var i = 0; i < array_id_lessons.length; i++) {
                        if (!pattern.test(array_id_lessons[i])) {
                            is_numbers_lesson = false;
                            break;
                        }
                    }

                    if (is_numbers_lesson) {
                        var id_lesson = $this.next().attr('href');
                        var pattern = /^[1-9][0-9]*$/;
                        if (pattern.test(id_lesson)) {
                            var $amount_regular_price;
                            var $amount_promotion_price;
                            var $price_tag = $this.parent().siblings('.price');
                            $amount_regular_price = $price_tag.children('.amount');
                            if ($amount_regular_price && $amount_regular_price.length < 1) {
                                $amount_regular_price = $price_tag.children('del').children('.amount');
                                $amount_promotion_price = $price_tag.children('ins').children('.amount');
                            }

                            if (!id_lessons_prices[id_lesson]) {
                                var price_instant = 0;
                                for (var i = 0; i < array_id_lessons.length; i++) {
                                    var $price_instant_element = $('[data-instant-parent="' + array_id_lessons[i] + '"][data-instant-kind="lekcja"]').first();
                                    var $price_tag_temp = $price_instant_element.siblings('.price');

                                    var $amount_regular_price_temp = $price_tag_temp.children('.amount');
                                    if ($amount_regular_price_temp && $amount_regular_price_temp.length < 1) {
                                        $amount_regular_price_temp = $price_tag_temp.children('del').children('.amount');
                                        var $amount_promotion_price_temp = $price_tag_temp.children('ins').children('.amount');
                                    }

                                    var price_instant_temp = parseFloat($amount_regular_price_temp.text());

                                    if ($amount_promotion_price_temp && $amount_promotion_price_temp.length > 0) {
                                        price_instant_temp = parseFloat($amount_promotion_price_temp.text());
                                    }

                                    price_instant += price_instant_temp;
                                }


                                var regular_price;
                                var regular_price_instant;
                                var promotion_price;
                                var promotion_price_instant;

                                regular_price = parseFloat($amount_regular_price.text());
                                regular_price_instant = regular_price + price_instant;

                                if ($amount_promotion_price != undefined) {
                                    promotion_price = parseFloat($amount_promotion_price.text());
                                    promotion_price_instant = promotion_price + price_instant;
                                }

                                if (regular_price != undefined) {
                                    id_lessons_prices[id_lesson] = {};
                                    id_lessons_prices[id_lesson]['regular_price'] = regular_price + currency;

                                    if (regular_price_instant != undefined) {
                                        id_lessons_prices[id_lesson]['regular_price_instant'] = regular_price_instant + currency;
                                    }
                                    if (promotion_price != undefined) {
                                        id_lessons_prices[id_lesson]['promotion_price'] = promotion_price + currency;
                                    }
                                    if (promotion_price_instant != undefined) {
                                        id_lessons_prices[id_lesson]['promotion_price_instant'] = promotion_price_instant + currency;
                                    }
                                }
                            }

                            if ($this.val() == 0) {
                                if (id_lessons_prices[id_lesson]['regular_price_instant'] != undefined && $amount_regular_price != undefined && $amount_regular_price.length > 0) {
                                    $amount_regular_price.text(id_lessons_prices[id_lesson]['regular_price_instant']);
                                }
                                if (id_lessons_prices[id_lesson]['promotion_price_instant'] != undefined && $amount_promotion_price != undefined && $amount_promotion_price.length > 0) {
                                    $amount_promotion_price.text(id_lessons_prices[id_lesson]['promotion_price_instant']);
                                }
                            } else {
                                if (id_lessons_prices[id_lesson]['regular_price'] != undefined && $amount_regular_price != undefined && $amount_regular_price.length > 0) {
                                    $amount_regular_price.text(id_lessons_prices[id_lesson]['regular_price']);
                                }
                                if (id_lessons_prices[id_lesson]['promotion_price'] != undefined && $amount_promotion_price != undefined && $amount_promotion_price.length > 0) {
                                    $amount_promotion_price.text(id_lessons_prices[id_lesson]['promotion_price']);
                                }
                            }
                        }
                    }
                } else {
                    var id_lesson = $this.next().attr('href');
                    var pattern = /^[1-9][0-9]*$/;
                    if (pattern.test(id_lesson)) {
                        var $amount_regular_price;
                        var $amount_promotion_price;
                        var $price_tag = $this.parent().siblings('.price');
                        $amount_regular_price = $price_tag.children('.amount');
                        if ($amount_regular_price && $amount_regular_price.length < 1) {
                            $amount_regular_price = $price_tag.children('del').children('.amount');
                            $amount_promotion_price = $price_tag.children('ins').children('.amount');
                        }

                        if (!id_lessons_prices[id_lesson]) {
                            var $price_instant_element = $('[data-instant-parent="' + id_lesson + '"][data-instant-kind="kurs"]').first();
                            if ($price_instant_element.is('input[type="checkbox"]')) {
                                var $price_tag_temp = $price_instant_element.siblings('.price');
                            } else {
                                var $price_tag_temp = $price_instant_element.parent().siblings('.price');
                            }

                            var $amount_regular_price_temp = $price_tag_temp.children('.amount');
                            if ($amount_regular_price_temp && $amount_regular_price_temp.length < 1) {
                                $amount_regular_price_temp = $price_tag_temp.children('del').children('.amount');
                                var $amount_promotion_price_temp = $price_tag_temp.children('ins').children('.amount');
                            }

                            var price_instant = parseFloat($amount_regular_price_temp.text());

                            if ($amount_promotion_price_temp && $amount_promotion_price_temp.length > 0) {
                                price_instant = parseFloat($amount_promotion_price_temp.text());
                            }

                            var regular_price;
                            var regular_price_instant;
                            var promotion_price;
                            var promotion_price_instant;

                            regular_price = parseFloat($amount_regular_price.text());
                            regular_price_instant = regular_price + price_instant;

                            if ($amount_promotion_price != undefined) {
                                promotion_price = parseFloat($amount_promotion_price.text());
                                promotion_price_instant = promotion_price + price_instant;
                            }

                            if (regular_price != undefined) {
                                id_lessons_prices[id_lesson] = {};
                                id_lessons_prices[id_lesson]['regular_price'] = regular_price + currency;

                                if (regular_price_instant != undefined) {
                                    id_lessons_prices[id_lesson]['regular_price_instant'] = regular_price_instant + currency;
                                }
                                if (promotion_price != undefined) {
                                    id_lessons_prices[id_lesson]['promotion_price'] = promotion_price + currency;
                                }
                                if (promotion_price_instant != undefined) {
                                    id_lessons_prices[id_lesson]['promotion_price_instant'] = promotion_price_instant + currency;
                                }
                            }
                        }

                        if ($this.val() == 0) {
                            if (id_lessons_prices[id_lesson]['regular_price_instant'] != undefined && $amount_regular_price != undefined && $amount_regular_price.length > 0) {
                                $amount_regular_price.text(id_lessons_prices[id_lesson]['regular_price_instant']);
                            }
                            if (id_lessons_prices[id_lesson]['promotion_price_instant'] != undefined && $amount_promotion_price != undefined && $amount_promotion_price.length > 0) {
                                $amount_promotion_price.text(id_lessons_prices[id_lesson]['promotion_price_instant']);
                            }
                        } else {
                            if (id_lessons_prices[id_lesson]['regular_price'] != undefined && $amount_regular_price != undefined && $amount_regular_price.length > 0) {
                                $amount_regular_price.text(id_lessons_prices[id_lesson]['regular_price']);
                            }
                            if (id_lessons_prices[id_lesson]['promotion_price'] != undefined && $amount_promotion_price != undefined && $amount_promotion_price.length > 0) {
                                $amount_promotion_price.text(id_lessons_prices[id_lesson]['promotion_price']);
                            }
                        }
                    }
                }
            }
            //przy zmianie trybu po dodaniu do koszyka na stronie Sklep/Kategorie
            else if ($this.next().hasClass('change_mode_course')) {
                //                var data_lessons_instant = $this.next().attr('data-lessons-instant');                
                //                if(data_lessons_instant != undefined){                    
                //                    //zmienić liczby po przecinku w tablicę i sprawdzić czy w tablicy są same liczby całkowite od 1
                //                    var array_id_lessons = data_lessons_instant.split(",").map(Number);
                //                    var is_numbers_lesson = true;
                //                    var pattern = /^[1-9][0-9]*$/;
                //                    for(var i=0; i<array_id_lessons.length; i++){                        
                //                        if(!pattern.test(array_id_lessons[i])){                              
                //                            is_numbers_lesson = false;
                //                            break;
                //                        }
                //                    }
                //                    
                //                    if(is_numbers_lesson){                        
                //                        var id_lesson = $this.next().attr('href');   
                //                        var pattern = /^[1-9][0-9]*$/;
                //                        if(pattern.test(id_lesson)){ 
                //                            var $amount_regular_price;
                //                            var $amount_promotion_price;
                //                            var $price_tag = $this.parent().find('.price');
                //                            $amount_regular_price = $price_tag.children('.amount');
                //                            if($amount_regular_price && $amount_regular_price.length < 1){
                //                                $amount_regular_price = $price_tag.children('del').children('.amount');
                //                                $amount_promotion_price = $price_tag.children('ins').children('.amount');
                //                            }
                //
                //                            if(!id_lessons_prices[id_lesson]){                                 
                //                                
                //                                var $price_instant = $this.siblings('.instant_price');
                //                                if($price_instant != undefined && $price_instant.length > 0){
                //                                    var price_instant = parseInt($price_instant.text());
                //                                }                                
                //                                else{
                //                                    var price_instant = 0;
                //                                    for(var i=0; i<array_id_lessons.length; i++){
                //                                        var $price_instant_element = $('[data-instant-parent="'+array_id_lessons[i]+'"][data-instant-kind="lekcja"]').first();                                                            
                //                                        var $price_tag_temp = $price_instant_element.siblings('.price');   
                //
                //                                        var $amount_regular_price_temp = $price_tag_temp.children('.amount');
                //                                        if($amount_regular_price_temp && $amount_regular_price_temp.length < 1){
                //                                            $amount_regular_price_temp = $price_tag_temp.children('del').children('.amount');
                //                                            var $amount_promotion_price_temp = $price_tag_temp.children('ins').children('.amount');                                
                //                                        }
                //
                //                                        var price_instant_temp = parseFloat($amount_regular_price_temp.text());
                //
                //                                        if($amount_promotion_price_temp && $amount_promotion_price_temp.length > 0){
                //                                            price_instant_temp = parseFloat($amount_promotion_price_temp.text());
                //                                        }                                    
                //
                //                                        price_instant += price_instant_temp;
                //                                    }  
                //                                }
                //                                                              
                //
                //                                var regular_price;
                //                                var regular_price_instant;  
                //                                var promotion_price;
                //                                var promotion_price_instant; 
                //
                //                                regular_price = parseFloat($amount_regular_price.text());                                
                //                                regular_price_instant = regular_price + price_instant;                                
                //                                
                //
                //                                if($amount_promotion_price != undefined){
                //                                    promotion_price = parseFloat($amount_promotion_price.text());
                //                                    promotion_price_instant = promotion_price + price_instant;
                //                                    
                //                                } 
                //
                //                                if(regular_price != undefined){
                //                                    id_lessons_prices[id_lesson] = {};
                //                                    id_lessons_prices[id_lesson]['regular_price'] = regular_price+currency;
                //
                //                                    if(regular_price_instant != undefined){
                //                                        id_lessons_prices[id_lesson]['regular_price_instant'] = regular_price_instant+currency;
                //                                    }
                //                                    if(promotion_price != undefined){
                //                                        id_lessons_prices[id_lesson]['promotion_price'] = promotion_price+currency;
                //                                    }
                //                                    if(promotion_price_instant != undefined){
                //                                        id_lessons_prices[id_lesson]['promotion_price_instant'] = promotion_price_instant+currency;
                //                                    }                                    
                //                                } 
                //                            }                            
                //                            if($this.val() == 0){
                //                                console.log('tryb0');
                //                                if(id_lessons_prices[id_lesson]['regular_price_instant'] != undefined && $amount_regular_price != undefined && $amount_regular_price.length > 0){
                //                                    $amount_regular_price.text(id_lessons_prices[id_lesson]['regular_price_instant']);
                //                                }
                //                                if(id_lessons_prices[id_lesson]['promotion_price_instant'] != undefined && $amount_promotion_price != undefined && $amount_promotion_price.length > 0){
                //                                    $amount_promotion_price.text(id_lessons_prices[id_lesson]['promotion_price_instant']);
                //                                }                        
                //                            }                            
                //                            else{
                //                                console.log('tryb');
                //                                if(id_lessons_prices[id_lesson]['regular_price'] != undefined && $amount_regular_price != undefined && $amount_regular_price.length > 0){
                //                                    $amount_regular_price.text(id_lessons_prices[id_lesson]['regular_price']);
                //                                }
                //                                if(id_lessons_prices[id_lesson]['promotion_price'] != undefined && $amount_promotion_price != undefined && $amount_promotion_price.length > 0){
                //                                    $amount_promotion_price.text(id_lessons_prices[id_lesson]['promotion_price']);
                //                                } 
                //                            }
                //                        }                        
                //                    }
                //                }
                //                else{
                var id_lesson = $this.next().attr('href');
                var pattern = /^[1-9][0-9]*$/;
                if (pattern.test(id_lesson)) {
                    var $amount_regular_price;
                    var $amount_promotion_price;
                    var $price_tag = $this.parent().find('.price');
                    $amount_regular_price = $price_tag.children('.amount');
                    if ($amount_regular_price && $amount_regular_price.length < 1) {
                        $amount_regular_price = $price_tag.children('del').children('.amount');
                        $amount_promotion_price = $price_tag.children('ins').children('.amount');
                    }

                    if (!id_lessons_prices[id_lesson]) {
                        //nowe
                        var $price_personal = $this.siblings('.price_personal');
                        //                            console.log($price_personal);
                        var price_personal = parseFloat($price_personal.text());
                        var regular_price_personal;
                        var promotion_price_personal;

                        var $price_instant = $this.siblings('.instant_price');
                        if ($price_instant != undefined && $price_instant.length > 0) {
                            var price_instant = parseInt($price_instant.text());
                        } else {
                            var $price_instant_element = $('[data-instant-parent="' + id_lesson + '"][data-instant-kind="kurs"]').first();
                            if ($price_instant_element.is('input[type="checkbox"]')) {
                                var $price_tag_temp = $price_instant_element.siblings('.price');
                            } else {
                                var $price_tag_temp = $price_instant_element.parent().siblings('.price');
                            }

                            var $amount_regular_price_temp = $price_tag_temp.children('.amount');
                            if ($amount_regular_price_temp && $amount_regular_price_temp.length < 1) {
                                $amount_regular_price_temp = $price_tag_temp.children('del').children('.amount');
                                var $amount_promotion_price_temp = $price_tag_temp.children('ins').children('.amount');
                            }

                            var price_instant = parseFloat($amount_regular_price_temp.text());

                            if ($amount_promotion_price_temp && $amount_promotion_price_temp.length > 0) {
                                price_instant = parseFloat($amount_promotion_price_temp.text());
                            }
                        }

                        var regular_price;
                        var regular_price_instant;
                        var promotion_price;
                        var promotion_price_instant;

                        regular_price = parseFloat($amount_regular_price.text());
                        regular_price_instant = regular_price + price_instant;

                        //nowe
                        //                            console.log(price_personal);
                        regular_price_personal = regular_price + price_personal;

                        if ($amount_promotion_price != undefined) {
                            promotion_price = parseFloat($amount_promotion_price.text());
                            promotion_price_instant = promotion_price + price_instant;
                            //nowe
                            promotion_price_personal = promotion_price + price_personal;
                        }

                        if (regular_price != undefined) {
                            id_lessons_prices[id_lesson] = {};
                            id_lessons_prices[id_lesson]['regular_price'] = regular_price + currency;

                            if (regular_price_instant != undefined) {
                                id_lessons_prices[id_lesson]['regular_price_instant'] = regular_price_instant + currency;
                            }
                            if (promotion_price != undefined) {
                                id_lessons_prices[id_lesson]['promotion_price'] = promotion_price + currency;
                            }
                            if (promotion_price_instant != undefined) {
                                id_lessons_prices[id_lesson]['promotion_price_instant'] = promotion_price_instant + currency;
                            }
                            //nowe
                            if (regular_price_personal != undefined) {
                                id_lessons_prices[id_lesson]['regular_price_personal'] = regular_price_personal + currency;
                            }
                            if (promotion_price_personal != undefined) {
                                id_lessons_prices[id_lesson]['promotion_price_personal'] = promotion_price_personal + currency;
                            }
                        }
                    }

                    if ($this.val() == 0) {
                        if (id_lessons_prices[id_lesson]['regular_price_instant'] != undefined && $amount_regular_price != undefined && $amount_regular_price.length > 0) {
                            $amount_regular_price.text(id_lessons_prices[id_lesson]['regular_price_instant']);
                        }
                        if (id_lessons_prices[id_lesson]['promotion_price_instant'] != undefined && $amount_promotion_price != undefined && $amount_promotion_price.length > 0) {
                            $amount_promotion_price.text(id_lessons_prices[id_lesson]['promotion_price_instant']);
                        }
                    }
                    //nowe
                    else if ($this.val() == -1) {
                        if (id_lessons_prices[id_lesson]['regular_price_personal'] != undefined && $amount_regular_price != undefined && $amount_regular_price.length > 0) {
                            $amount_regular_price.text(id_lessons_prices[id_lesson]['regular_price_personal']);
                        }
                        if (id_lessons_prices[id_lesson]['promotion_price_personal'] != undefined && $amount_promotion_price != undefined && $amount_promotion_price.length > 0) {
                            $amount_promotion_price.text(id_lessons_prices[id_lesson]['promotion_price_personal']);
                        }
                    } else {
                        if (id_lessons_prices[id_lesson]['regular_price'] != undefined && $amount_regular_price != undefined && $amount_regular_price.length > 0) {
                            $amount_regular_price.text(id_lessons_prices[id_lesson]['regular_price']);
                        }
                        if (id_lessons_prices[id_lesson]['promotion_price'] != undefined && $amount_promotion_price != undefined && $amount_promotion_price.length > 0) {
                            $amount_promotion_price.text(id_lessons_prices[id_lesson]['promotion_price']);
                        }
                    }
                }
                //                }



            }
            //strona dla jednego produktu
            else {
                var id_lesson = $this.siblings('[name="add-to-cart"]').val();
                var pattern = /^[1-9][0-9]*$/;
                if (pattern.test(id_lesson)) {
                    var $amount_regular_price;
                    var $amount_promotion_price;
                    var $price_tag = $this.parent().prev().children('.price');
                    $amount_regular_price = $price_tag.children('.amount');
                    if ($amount_regular_price && $amount_regular_price.length < 1) {
                        $amount_regular_price = $price_tag.children('del').children('.amount');
                        $amount_promotion_price = $price_tag.children('ins').children('.amount');
                    }

                    if (!id_lessons_prices[id_lesson]) {
                        var $price_instant = $this.siblings('#price_instant');
                        var price_instant = parseFloat($price_instant.val());

                        var regular_price;
                        var regular_price_instant;
                        var promotion_price;
                        var promotion_price_instant;

                        //nowe
                        var $price_personal = $this.siblings('#price_personal');
                        var price_personal = parseFloat($price_personal.val());
                        var regular_price_personal;
                        var promotion_price_personal;


                        regular_price = parseFloat($amount_regular_price.text());
                        regular_price_instant = regular_price + price_instant;

                        //nowe
                        regular_price_personal = regular_price + price_personal;


                        if ($amount_promotion_price != undefined) {
                            promotion_price = parseFloat($amount_promotion_price.text());
                            promotion_price_instant = promotion_price + price_instant;
                            //nowe
                            promotion_price_personal = promotion_price + price_personal;
                        }

                        if (regular_price != undefined) {
                            id_lessons_prices[id_lesson] = {};
                            id_lessons_prices[id_lesson]['regular_price'] = regular_price + currency;

                            if (regular_price_instant != undefined) {
                                id_lessons_prices[id_lesson]['regular_price_instant'] = regular_price_instant + currency;
                            }
                            if (promotion_price != undefined) {
                                id_lessons_prices[id_lesson]['promotion_price'] = promotion_price + currency;
                            }
                            if (promotion_price_instant != undefined) {
                                id_lessons_prices[id_lesson]['promotion_price_instant'] = promotion_price_instant + currency;
                            }
                            //nowe
                            if (regular_price_personal != undefined) {
                                id_lessons_prices[id_lesson]['regular_price_personal'] = regular_price_personal + currency;
                            }
                            if (promotion_price_personal != undefined) {
                                id_lessons_prices[id_lesson]['promotion_price_personal'] = promotion_price_personal + currency;
                            }
                        }

                    }

                    if ($this.val() == 0) {
                        if (id_lessons_prices[id_lesson]['regular_price_instant'] != undefined && $amount_regular_price != undefined && $amount_regular_price.length > 0) {
                            $amount_regular_price.text(id_lessons_prices[id_lesson]['regular_price_instant']);
                        }
                        if (id_lessons_prices[id_lesson]['promotion_price_instant'] != undefined && $amount_promotion_price != undefined && $amount_promotion_price.length > 0) {
                            $amount_promotion_price.text(id_lessons_prices[id_lesson]['promotion_price_instant']);
                        }
                    }
                    //nowe
                    else if ($this.val() == -1) {
                        if (id_lessons_prices[id_lesson]['regular_price_personal'] != undefined && $amount_regular_price != undefined && $amount_regular_price.length > 0) {
                            $amount_regular_price.text(id_lessons_prices[id_lesson]['regular_price_personal']);
                        }
                        if (id_lessons_prices[id_lesson]['promotion_price_personal'] != undefined && $amount_promotion_price != undefined && $amount_promotion_price.length > 0) {
                            $amount_promotion_price.text(id_lessons_prices[id_lesson]['promotion_price_personal']);
                        }
                    } else {
                        if (id_lessons_prices[id_lesson]['regular_price'] != undefined && $amount_regular_price != undefined && $amount_regular_price.length > 0) {
                            $amount_regular_price.text(id_lessons_prices[id_lesson]['regular_price']);
                        }
                        if (id_lessons_prices[id_lesson]['promotion_price'] != undefined && $amount_promotion_price != undefined && $amount_promotion_price.length > 0) {
                            $amount_promotion_price.text(id_lessons_prices[id_lesson]['promotion_price']);
                        }
                    }
                }
            }
        });

        $('.course_mode').change();

        //usunięcie Suma i Dodaj do koszyka pod listą, gdzie wszystkie checkboxy są zaznaczone i nieaktywne
        var group_class = '';
        $('input[data-kind="products_to_add"]').each(function() {
            var $this = $(this);
            var actual_class = $this.attr('class');
            if (actual_class != group_class) {
                group_class = actual_class;
                var is_hide_sum_and_cart = true;
                var id = actual_class.substring(actual_class.lastIndexOf('_') + 1);
                $('.' + actual_class).each(function() {
                    var $this_checkbox = $(this);
                    if (!$this_checkbox.is(':checked:disabled')) {
                        is_hide_sum_and_cart = false;
                        return false;
                    }
                });
                if (is_hide_sum_and_cart) {
                    $('#sum_check_products_' + id).hide();
                    $('#add_products_to_cart_' + id).parent().hide();
                }
            }
        });

        //usunięcie linku przywrócenia produktu z powodu kursów z powiązanymi lekcjami
        var $link_return_product = $('a[href*="?undo_item="]');
        if ($link_return_product.length > 0) {
            $link_return_product.remove();
        }

        //potwierdzenie ukończenia lekcji przez kursanta
        $('#finish_lesson').click(function() {
            var $this = $(this);
            var $ajax_loader = $('#ajax_loader');
            var $error_message = $('#error_message');
            var $product_id_lesson = $('#product_id_lesson');
            var $subsc_access = $('#subsc_access');
            var $prev_lesson = $('#prev_lesson');
            var $next_lesson = $('#next_lesson');
            var $grats_page = $('#grats_page');
            //            var $start_lesson = $('#start_lesson');
            var $progressbar_course = $('#progressbar_course');
            var $progress_course_value = $('#progress_course_value > span');

            $error_message.text('');
            $error_message.hide();
            $this.prop('disabled', true);
            $ajax_loader.show();

            $.ajax({
                type: 'POST',
                dataType: 'json',
                data: {
                    product_id_lesson: $product_id_lesson.text(),
                    subsc_access: $subsc_access.text(),
                    kind_button: $this.attr('id')
                },
                success: function(data) {

                    $ajax_loader.hide();
                    $this.prop('disabled', false);

                    if (('href_prev_lesson' in data) && data.href_prev_lesson !== '') {
                        $prev_lesson.attr('href', data.href_prev_lesson);
                        $prev_lesson.show();
                    }

                    if (('href_next_lesson' in data) && data.href_next_lesson !== '') {
                        $next_lesson.attr('href', data.href_next_lesson);
                        $next_lesson.show();
                    }

                    if (('href_grats_page' in data) && data.href_grats_page !== '') {
                        $grats_page.attr('href', data.href_grats_page);
                        $grats_page.show();
                    }

                    if (('count_finished_lessons' in data) && data.count_finished_lessons !== '' && ('count_all_lessons' in data)) {
                        $('html, body').animate({
                            scrollTop: 0
                        }, 500);
                        var actual_progress = Math.ceil((data.count_finished_lessons / data.count_all_lessons) * 100);
                        $progressbar_course.animate({
                            width: actual_progress + '%'
                        }, 3000);
                        var old_value_progress = parseInt($progress_course_value.text());
                        $({
                            progressValue: old_value_progress
                        }).animate({
                            progressValue: actual_progress
                        }, {
                            duration: 3000,
                            easing: 'swing',
                            step: function() {
                                $progress_course_value.text(Math.ceil(this.progressValue));
                            },
                            complete: function() {
                                if (data.href_grats_page) {
                                    window.setTimeout(function() {
                                        window.location.href = data.href_grats_page;
                                    }, 1000);
                                } else {
                                    if (data.list_lessons_to_buy) {
                                        $this.parent().after(data.list_lessons_to_buy);
                                    }
                                }
                            }
                        });
                        $this.hide();
                        $this.prev().hide();
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    $error_message.text('textStatus = ' + textStatus + ' errorThrown = ' + errorThrown + ' Coś poszło nie tak. Zakończ ' + lekcja_biernik + ' ponownie. Jeśli komunikat się powtarza, to napisz do nas o swoim problemie na stronie Kontakt. Dziękujęmy!');
                    $error_message.show();
                    $ajax_loader.hide();
                    $this.prop('disabled', false);
                }
            });

            return false;
        });


        //cofnięcie lekcji przez kursanta
        //        $('#start_lesson').click(function(){
        //            var $this = $(this);
        //            var $ajax_loader = $('#ajax_loader');  
        //            var $error_message = $('#error_message');
        //            var $product_id_lesson = $('#product_id_lesson');
        //            var $prev_lesson = $('#prev_lesson');           
        //            var $next_lesson = $('#next_lesson');
        //            var $finish_lesson = $('#finish_lesson');
        //            var $progressbar_course = $('#progressbar_course');
        //            var $progress_course_value = $('#progress_course_value > span');
        //            
        //            $error_message.text('');
        //            $error_message.hide();            
        //            $this.prop('disabled', true);                
        //            $ajax_loader.show();
        //
        //            $.ajax({                
        //                type: 'POST',
        //                dataType: 'json',
        //                data: {
        //                    product_id_lesson: $product_id_lesson.text(),
        //                    kind_button: $this.attr('id')
        //                },
        //                success: function(data){     
        //                    $ajax_loader.hide();
        //                    $this.prop('disabled', false);
        //                    
        //                    $prev_lesson.hide();
        //                    $next_lesson.hide();
        //                    
        //                    if(('href_prev_lesson' in data) && data.href_prev_lesson !== ''){
        //                        $prev_lesson.attr('href', data.href_prev_lesson);
        //                        $prev_lesson.show();                        
        //                    }
        //                    
        //                    if(('href_next_lesson' in data) && data.href_next_lesson !== ''){
        //                        $next_lesson.attr('href', data.href_next_lesson);
        //                        $next_lesson.show();                        
        //                    }
        //                    
        //                    if( ('count_finished_lessons' in data) && ('count_all_lessons' in data) ){
        //                        var actual_progress = Math.ceil((data.count_finished_lessons / data.count_all_lessons) * 100);
        //                        $progressbar_course.css('width', actual_progress+'%');
        //                        $progress_course_value.text(actual_progress);
        //                        $this.hide();
        //                        $this.prev().hide();
        //                        $finish_lesson.show();
        //                        $finish_lesson.prev().show();  
        //                    }                                   
        //                },
        //                error: function(){                        
        //                    $error_message.text('Coś poszło nie tak. Cofnij lekcję ponownie. Jeśli komunikat się powtarza, to napisz do nas o swoim problemie na stronie Kontakt. Dziękujęmy!');
        //                    $error_message.show();
        //                    $ajax_loader.hide()
        //                    $this.prop('disabled', false);                   
        //                }
        //            });
        //              
        //            return false;
        //        });

        Number.prototype.roundUsing = function(func, prec) {
            var temp = this * Math.pow(10, prec);
            temp = func(temp);
            return temp / Math.pow(10, prec);
        };

        //odliczanie czasu do np. za ile czasu można zrobić ćwiczenie lub lekcja będzie odblokowana
        function runCountDown($countdown_obj) {
            if ($countdown_obj.length > 0) {
                var days_span = $countdown_obj.children('.days');
                var hours_span = $countdown_obj.children('.hours');
                var minutes_span = $countdown_obj.children('.minutes');
                var seconds_span = $countdown_obj.children('.seconds');
                var seconds = parseInt(seconds_span.text());

                var minutes = seconds / 60;
                var hours = minutes / 60;
                var days = hours / 24;

                var sLeft = Math.floor(seconds % 60);
                var minLeft = Math.floor(minutes % 60);
                var hLeft = Math.floor(hours % 24);
                var dLeft = Math.floor(days);

                if (minLeft < 10)
                    minLeft = "0" + minLeft;
                if (sLeft < 10)
                    sLeft = "0" + sLeft;
                if (hLeft < 10)
                    hLeft = "0" + hLeft;

                if (dLeft > 0) {
                    days_span.text(dLeft + 'd');
                } else {
                    days_span.hide();
                }

                hours_span.text(hLeft);
                minutes_span.text(minLeft);
                seconds_span.text(sLeft);

                if (seconds > 0) {
                    var countdown = window.setInterval(function() {

                        minutes = seconds / 60;
                        hours = minutes / 60;
                        days = hours / 24;

                        sLeft = Math.floor(seconds % 60);
                        minLeft = Math.floor(minutes % 60);
                        hLeft = Math.floor(hours % 24);
                        dLeft = Math.floor(days);

                        if (minLeft < 10)
                            minLeft = "0" + minLeft;
                        if (sLeft < 10)
                            sLeft = "0" + sLeft;
                        if (hLeft < 10)
                            hLeft = "0" + hLeft;

                        days_span.text(dLeft + 'd');
                        hours_span.text(hLeft);
                        minutes_span.text(minLeft);
                        seconds_span.text(sLeft);

                        if (seconds > 0) {
                            seconds--;
                        } else {
                            window.clearInterval(countdown);
                            window.location.reload();
                        }

                    }, 1000);
                }
            }
        }

        runCountDown($('.countdown'));

        //https://developers.google.com/youtube/iframe_api_reference?hl=pl
        var playerYT;
        var $play_video_on_button = $('#play_video_on_button');
        var videoYtId = $play_video_on_button.attr('video-id');

        playerYT = new YT.Player('play_video_on_button', {
            height: '360',
            width: '640',
            videoId: videoYtId,
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });

        function onPlayerReady(event) {
            //start ćwiczenia
            $start_exercise.click(function() {
                var $this = $(this);
                var $ajax_loader = $('#ajax_loader_exercise');
                var $error_message = $('#error_message_exercise');
                var $product_id_lesson = $('#product_id_lesson');

                $progressbar_exercise.css('width', 0);
                $ajax_loader.show();
                $this.hide();
                is_progress_start = false;
                is_out_page = false;
                $exercise_start_message.hide();
                $exercise_progress_content.show();

                $.ajax({
                    type: 'POST',
                    dataType: 'text',
                    data: {
                        product_id_lesson: $product_id_lesson.text(),
                        start_exercise: 'start_exercise'
                    },
                    success: function(data) {
                        data = parseInt(data);
                        $ajax_loader.hide();
                        if (isNaN(data) || is_out_page) {
                            $this.css('display', 'block');
                        } else {
                            //stop and start video   
                            event.target.stopVideo();
                            event.target.playVideo();

                            is_progress_start = true;
                            $progressbar_exercise_box.show();
                            var procent_progress_step = parseFloat(100 / data);
                            procent_progress_step = procent_progress_step.roundUsing(Math.ceil, 2);
                            var procent_progress = 0;

                            start_time_exercise = window.setTimeout(function() {
                                progress_exercise = window.setInterval(function() {
                                    procent_progress += parseFloat(procent_progress_step);
                                    $progressbar_exercise.animate({
                                        width: procent_progress + '%'
                                    }, 1000, 'linear');
                                }, 1000);
                                end_time_exercise = window.setTimeout(function() {
                                    window.clearInterval(progress_exercise);
                                    $end_exercise.css('display', 'block');
                                }, (data + 1) * 1000);
                            }, 2000);

                        }

                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        $ajax_loader.hide();
                        $error_message.show();
                        $exercise_start_message.show();
                        $exercise_progress_content.hide();
                    }
                });
            });


        }

        //stop video kiedy wyjdę ze strony lub kliknę na odtwarzacz lub zakończę ćwiczenia
        function onPlayerStateChange(event) {
            $(window).blur(function() {
                if (event.data == YT.PlayerState.PLAYING) {
                    playerYT.stopVideo();
                }
            });

            $end_exercise.click(function() {
                if (event.data == YT.PlayerState.PLAYING) {
                    playerYT.stopVideo();
                }
                return false;
            });
        }

        var progress_exercise, end_time_exercise, start_time_exercise;
        var $start_exercise = $('#start_exercise');
        var $progressbar_exercise_box = $('#progressbar_exercise_box');
        var $progressbar_exercise = $('#progressbar_exercise');
        var $end_exercise = $('#end_exercise');
        var is_progress_start = false;
        var is_out_page = false;
        var $exercise_start_message = $('#exercise_start_message');
        var $exercise_progress_content = $('#exercise_progress_content');

        var $submit_task = $('.task_box form input[type="submit"]');

        //wyjście z okna/zakładki przeglądarki lub kliknięcie na odtwarzacz resetuje postęp ćwiczenia
        $(window).blur(function() {
            is_out_page = true;
            if ($end_exercise.css('display') === 'none' && is_progress_start) {
                window.clearTimeout(start_time_exercise);
                window.clearInterval(progress_exercise);
                window.clearTimeout(end_time_exercise);
                $progressbar_exercise_box.hide();
                $start_exercise.css('display', 'block');
                $exercise_start_message.show();
                $exercise_progress_content.hide();
            }
        });

        //ukończenia lekcji gdy kursant wypełni wszystkie zadania do danej lekcji przy kliknięciu zakończenia ćwiczenia
        $end_exercise.click(function() {
            var $this = $(this);
            var $ajax_loader = $('#ajax_loader_exercise');
            var $error_message = $('#error_message_exercise');
            var $product_id_lesson = $('#product_id_lesson');
            var $subsc_access = $('#subsc_access');
            var $prev_lesson = $('#prev_lesson');
            var $next_lesson = $('#next_lesson');
            var $grats_page = $('#grats_page');
            var $progressbar_course = $('#progressbar_course');
            var $progress_course_value = $('#progress_course_value > span');

            var $complete_exercise = $('#complete_exercise');
            var $progressbar_exercise_box = $('#progressbar_exercise_box');
            var $round_exercise = $('#round_exercise');
            var $span_round_exercise = $round_exercise.find('span');
            var $your_amount_exercise_span = $('#your_amount_exercise span');

            $progressbar_exercise_box.hide();
            $this.hide();
            $ajax_loader.show();
            $submit_task.hide();
            $error_message.hide();

            $.ajax({
                type: 'POST',
                dataType: 'json',
                data: {
                    product_id_lesson: $product_id_lesson.text(),
                    subsc_access: $subsc_access.text(),
                    end_exercise: 'end_exercise'
                },
                success: function(data) {

                    $ajax_loader.hide();

                    if ((('amount_round_exercise_the_lesson' in data) && data.amount_round_exercise_the_lesson !== '') &&
                        (('amount_round_exercise' in data) && data.amount_round_exercise !== '')) {
                        if (data.amount_round_exercise_the_lesson < data.amount_round_exercise) {
                            $span_round_exercise.text(data.amount_round_exercise_the_lesson);
                            $start_exercise.css('display', 'block');
                            $exercise_start_message.show();
                            $exercise_progress_content.hide();
                        } else {
                            $span_round_exercise.text(data.amount_round_exercise_the_lesson);
                            $complete_exercise.css('display', 'inline-block');

                            if (('amount_finished_exercise_the_lesson' in data) && data.amount_finished_exercise_the_lesson !== '') {
                                $your_amount_exercise_span.text(data.amount_finished_exercise_the_lesson);
                            }

                            if (('message_unblock_exercise' in data) && data.message_unblock_exercise !== '') {
                                $complete_exercise.after(data.message_unblock_exercise);
                                runCountDown($('.countdown'));
                            }
                            $start_exercise.remove();
                            $this.remove();
                        }
                    }

                    $submit_task.css('display', 'inline-block');

                    if (('href_prev_lesson' in data) && data.href_prev_lesson !== '') {
                        $prev_lesson.attr('href', data.href_prev_lesson);
                        $prev_lesson.show();
                    }

                    if (('href_next_lesson' in data) && data.href_next_lesson !== '') {
                        $next_lesson.attr('href', data.href_next_lesson);
                        $next_lesson.show();
                    }

                    if (('href_grats_page' in data) && data.href_grats_page !== '') {
                        $grats_page.attr('href', data.href_grats_page);
                        $grats_page.show();
                    }

                    if (('is_finished_lesson' in data) && data.is_finished_lesson === 'yes') {

                        window.setTimeout(function() {
                            if (('count_finished_lessons' in data) && data.count_finished_lessons !== '' && ('count_all_lessons' in data)) {
                                $('html, body').animate({
                                    scrollTop: 0
                                }, 500);
                                var actual_progress = Math.ceil((data.count_finished_lessons / data.count_all_lessons) * 100);
                                $progressbar_course.animate({
                                    width: actual_progress + '%'
                                }, 3000);
                                var old_value_progress = parseInt($progress_course_value.text());
                                $({
                                    progressValue: old_value_progress
                                }).animate({
                                    progressValue: actual_progress
                                }, {
                                    duration: 3000,
                                    easing: 'swing',
                                    step: function() {
                                        $progress_course_value.text(Math.ceil(this.progressValue));
                                    },
                                    complete: function() {
                                        if (data.href_grats_page) {
                                            window.setTimeout(function() {
                                                window.location.href = data.href_grats_page;
                                            }, 1000);
                                        } else {
                                            if (data.list_lessons_to_buy) {
                                                $('#finish_lesson_footer').after(data.list_lessons_to_buy);
                                            }
                                        }
                                    }
                                });
                            }
                        }, 1000);
                        $('#finish_tasks_message').hide();
                    }

                },
                error: function(jqXHR, textStatus, errorThrown) {
                    $this.css('display', 'block');
                    $submit_task.css('display', 'inline-block');
                    $error_message.show();
                    $ajax_loader.hide();
                }
            });

            return false;
        });

        //        $(document).on('submit', '.form_task', function(){ 
        //            var $this = $(this);  
        //            console.log($this);
        //            console.log($this[0]);
        //            var formData = new FormData($(this)[0]); 
        //            console.log(formData.getAll('files_upload_answer'));
        //            return false;
        //        });

        //wysłanie odpowiedzi na zadanie i zakończenie lekcji jeśli wszystkie zadania i ćwiczenie w danej lekcji jest ukończone
        $submit_task.click(function() {
            var $this = $(this);
            var $ajax_loader = $this.siblings('.ajax_loader_task');
            var $error_message = $this.siblings('.error_message_task');
            var $error_message2 = $this.siblings('.error_message_task2');

            var $task_id = $this.siblings('input[name="task_id"]');
            var $lesson_id = $this.siblings('input[name="lesson_id"]');
            var $task_lesson_id = $this.siblings('input[name="task_lesson_id"]');

            var $text_answer = $this.parent().find('textarea[name="text_answer"]');
            var $files_upload_answer = $this.parent().find('input[name="files_upload_answer"]');
            var $text_message = $this.parent().find('textarea[name="text_message"]');

            var text_answer_val = '';
            var text_message_val = '';
            var subsc_access_val = '';

            var data_send = new FormData();

            if ($text_answer.length > 0) {
                text_answer_val = $text_answer.val();
            }
            data_send.append('text_answer', text_answer_val);

            if ($files_upload_answer.length > 0) {
                data_send.append('files_upload_answer', $files_upload_answer[0].files[0]);
            }
            if ($text_message.length > 0) {
                text_message_val = $text_message.val();
            }
            data_send.append('text_message', text_message_val);

            var $subsc_access = $('#subsc_access');
            if ($subsc_access.length > 0) {
                subsc_access_val = $subsc_access.text();
            }
            data_send.append('subsc_access', subsc_access_val);

            var $prev_lesson = $('#prev_lesson');
            var $next_lesson = $('#next_lesson');
            var $grats_page = $('#grats_page');
            var $progressbar_course = $('#progressbar_course');
            var $progress_course_value = $('#progress_course_value > span');

            if ($task_id.length > 0 && $lesson_id.length > 0) {
                data_send.append('lesson_id', $lesson_id.val());
                data_send.append('task_id', $task_id.val());
            } else {
                if ($task_lesson_id.length > 0) {
                    data_send.append('task_lesson_id', $task_lesson_id.val());
                }
            }

            if (data_send !== undefined) {

                var is_visible_end_exercise = $end_exercise.is(':visible');
                if (is_visible_end_exercise) {
                    $end_exercise.hide();
                }

                $ajax_loader.show();
                $submit_task.hide();
                $error_message.hide();
                $error_message2.empty();
                $error_message2.hide();

                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    data: data_send,
                    cache: false,
                    contentType: false,
                    enctype: 'multipart/form-data',
                    processData: false,
                    success: function(data) {

                        console.log(data);

                        $ajax_loader.hide();
                        if (is_visible_end_exercise) {
                            $end_exercise.css('display', 'block');
                        }
                        $submit_task.css('display', 'inline-block');

                        if (('name_course_db' in data) && data.name_course_db !== '') {
                            //kod wykonany dla wszystkich zadań

                            if (('error_message_task2' in data) && data.error_message_task2 === '') {
                                if (('html_result' in data) && data.html_result !== '') {
                                    $this.parent().parent().html(data.html_result);

                                    if (data.name_course_db !== 'Strona statyczna') {
                                        //kod tylko dla zadań w lekcji
                                        if (('href_prev_lesson' in data) && data.href_prev_lesson !== '') {
                                            $prev_lesson.attr('href', data.href_prev_lesson);
                                            $prev_lesson.show();
                                        }

                                        if (('href_next_lesson' in data) && data.href_next_lesson !== '') {
                                            $next_lesson.attr('href', data.href_next_lesson);
                                            $next_lesson.show();
                                        }

                                        if (('href_grats_page' in data) && data.href_grats_page !== '') {
                                            $grats_page.attr('href', data.href_grats_page);
                                            $grats_page.show();
                                        }

                                        if (('is_finished_lesson' in data) && data.is_finished_lesson === 'yes') {

                                            window.setTimeout(function() {
                                                if (('count_finished_lessons' in data) && data.count_finished_lessons !== '' && ('count_all_lessons' in data)) {
                                                    $('html, body').animate({
                                                        scrollTop: 0
                                                    }, 500);
                                                    var actual_progress = Math.ceil((data.count_finished_lessons / data.count_all_lessons) * 100);
                                                    $progressbar_course.animate({
                                                        width: actual_progress + '%'
                                                    }, 3000);
                                                    var old_value_progress = parseInt($progress_course_value.text());
                                                    $({
                                                        progressValue: old_value_progress
                                                    }).animate({
                                                        progressValue: actual_progress
                                                    }, {
                                                        duration: 3000,
                                                        easing: 'swing',
                                                        step: function() {
                                                            $progress_course_value.text(Math.ceil(this.progressValue));
                                                        },
                                                        complete: function() {
                                                            if (data.href_grats_page) {
                                                                window.setTimeout(function() {
                                                                    window.location.href = data.href_grats_page;
                                                                }, 1000);
                                                            } else {
                                                                if (data.list_lessons_to_buy) {
                                                                    $('#finish_lesson_footer').after(data.list_lessons_to_buy);
                                                                }
                                                            }
                                                        }
                                                    });
                                                }
                                            }, 1000);
                                            $('#finish_tasks_message').hide();
                                        }
                                    }
                                }
                            } else {
                                $error_message2.html(data.error_message_task2).show();
                            }
                        }
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        $submit_task.css('display', 'inline-block');
                        $error_message.show();
                        $ajax_loader.hide();
                        if (is_visible_end_exercise) {
                            $end_exercise.css('display', 'block');
                        }
                    }
                });
            }

            return false;
        });

        var $submit_first_task_block_mode = $('.task_box form .submit_first_task_block_mode');
        //wysłanie odpowiedzi na zadanie na stronie, gdzie zadanie jest blokowane co jakiś czas i można wielokrotnie na nie odpowiadać
        //dostając automatycznie punkty, a odpowiedzi nie są zapisywanie w bazie danych
        $submit_first_task_block_mode.click(function() {
            var $this = $(this);
            var $ajax_loader = $this.siblings('.ajax_loader_task');
            var $error_message = $this.siblings('.error_message_task');
            var $error_message2 = $this.siblings('.error_message_task2');

            var $task_id = $this.siblings('input[name="task_id_block"]');
            var $lesson_id = $this.siblings('input[name="lesson_id_block"]');

            var $text_answer = $this.parent().find('textarea[name="text_answer_block"]');
            var $files_upload_answer = $this.parent().find('input[name="files_upload_answer_block"]');

            var text_answer_val = '';

            var data_send = new FormData();

            if ($text_answer.length > 0) {
                text_answer_val = $text_answer.val();
            }
            data_send.append('text_answer_block', text_answer_val);

            if ($files_upload_answer.length > 0) {
                data_send.append('files_upload_answer_block', $files_upload_answer[0].files[0]);
            }

            if ($task_id.length > 0 && $lesson_id.length > 0) {
                data_send.append('lesson_id_block', $lesson_id.val());
                data_send.append('task_id_block', $task_id.val());
            }

            if (data_send !== undefined) {

                $ajax_loader.show();
                $submit_first_task_block_mode.hide();
                $error_message.hide();
                $error_message2.empty();
                $error_message2.hide();

                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    data: data_send,
                    cache: false,
                    contentType: false,
                    enctype: 'multipart/form-data',
                    processData: false,
                    success: function(data) {
                        console.log(data);
                        $ajax_loader.hide();
                        $submit_first_task_block_mode.css('display', 'inline-block');

                        if (('error_message_task2' in data) && data.error_message_task2 === '') {
                            if (('html_result' in data) && data.html_result !== '') {
                                console.log($this.parent().parent().parent());
                                $this.parent().parent().parent().html(data.html_result);

                            }
                        } else {
                            $error_message2.html(data.error_message_task2).show();
                        }
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        $submit_first_task_block_mode.css('display', 'inline-block');
                        $error_message.show();
                        $ajax_loader.hide();
                    }
                });
            }

            return false;
        });

        //zmiana adres URL w przycisku kierującego do wybranego kursu przy zmianie wartości na liście
        var $list_lessons = $('#list_lessons');
        $list_lessons.change(function() {
            var $this = $(this);
            var $change_lesson = $('#change_lesson');
            $change_lesson.attr('href', $this.val());
        });

        $list_lessons.change();

        //przełączanie zakładek w Moje kursy
        var $tabs_moje_kursy = $('#tabs_moje_kursy');
        $('#menu_moje_kursy', $tabs_moje_kursy).find('a').click(function() {
            var $this = $(this);
            if (!$this.hasClass('current_item')) {
                $this.parent().parent().find('a').removeClass('current_item');
                $this.addClass('current_item');
                var id_current_tab = $this.attr('href');
                $tabs_moje_kursy.children('.tab').removeClass('current_tab');
                $(id_current_tab, $tabs_moje_kursy).addClass('current_tab');
            }
            return false;
        });

        //usunięcie kategorii, które nie mają rekordów
        $tabs_moje_kursy.find('.category_contener_products:empty').each(function() {
            var $this = $(this);
            $this.prev('h2').remove();
            $this.remove();
        });

        //Wpisz komunikat w zakładkach w której nie ma treści
        $tabs_moje_kursy.children('.tab').each(function() {
            var $this = $(this);
            if ($this.text().trim() == '') {
                var id = $this.attr('id');
                var message = '';
                switch (id) {
                    case 'course_progress':
                        message = 'Nie masz żadnych ' + kurs_dopelniacz_mnoga + ' na biegu';
                        break;
                    case 'course_finished':
                        message = 'Nie masz ukończonych ' + kurs_dopelniacz_mnoga;
                        break;
                    case 'rest_products':
                        message = 'Nie masz innych produktów';
                        break;
                }
                $this.text(message);
            }
        });

        //przełączanie kategorii w zakładkach w Moje kursy
        $('#product_category_list li a').click(function() {
            var $this = $(this);
            $this.parent().parent().find('a').removeClass('current_item');
            $this.addClass('current_item');
            var id = $this.attr('href');
            $('.category_contener_products').hide();
            $(id).fadeIn();
            return false;
        });

        //rozwijanie i zwijanie listy lekcji w zakładce Moje kursy
        $('.category_contener_products .product .list_lesson').click(function() {
            var $this = $(this);
            var $lessons = $this.parent().parent().next('.lessons');
            if ($this.hasClass('show')) {
                $this.removeClass('show');
                $this.addClass('hide');
                $lessons.slideDown();
            } else {
                $this.removeClass('hide');
                $this.addClass('show');
                $lessons.slideUp();
            }
            return false;
        });

        //zmiana trybu kursu w zakupionej lekcji
        var button_change_mode = $('.section_change_mode a');
        var id_mode = button_change_mode.prev('select').val();

        button_change_mode.click(function() {
            var $this = $(this);
            var $select = $this.prev('select');
            var id_mode_change = $select.val();
            if (id_mode_change != id_mode) {
                var id_course = $this.parent().prev('span').text();
                var $ajax_info = $this.next('.ajax_loader_right');
                $ajax_info.show();
                $this.prop('disabled', true);

                $.ajax({
                    type: 'POST',
                    dataType: 'text',
                    data: {
                        id_mode_change: id_mode_change,
                        id_course: id_course
                    },
                    success: function(data) {
                        $ajax_info.hide();
                        $this.prop('disabled', false);

                        if (data && data != -1) {
                            var $options = $select.children('option');
                            $options.attr('selected', false);
                            $options.each(function() {
                                var $this_option = $(this);
                                if ($this_option.val() == data) {
                                    $this_option.attr('selected', 'selected');
                                    return false;
                                }
                            });
                            id_mode = id_mode_change;
                            show_modal_window('Tryb tego ' + kurs_dopelniacz + ' został zmieniony.');
                        } else {
                            show_modal_window('Tryb tego ' + kurs_dopelniacz + ' nie został zmieniony.');
                        }
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        $this.prop('disabled', false);
                        $ajax_info.hide();
                        show_modal_window('Coś poszło nie tak. Zmień tryb ponownie. Jeśli komunikat się powtarza, to napisz do nas o swoim problemie na stronie Kontakt. Dziękujęmy!');
                    }
                });
            }
            return false;
        });

        //usunięcie zdarzenia z WC po kliknięciu w przycisk Dodania opinii
        $('body').off('click', '#respond #submit');

        //sprawdzenie wypełnienia pól formularza do napisania komentarza pod produktem
        $('#submit', '#commentform').click(function() {
            var $this = $(this);
            var $author_field = $this.parent().siblings('.comment-form-author').children('#author');
            var $email_field = $this.parent().siblings('.comment-form-email').children('#email');
            var $rating_field = $this.parent().siblings('.comment-form-rating').find('a');
            var $comment_field = $this.parent().siblings('.comment-form-comment').children('#comment');
            var message = '';

            if ($author_field.val().isEmpty()) {
                message += 'Proszę uzuepłnij pole autora.<br>';
            }
            if ($email_field.val().isEmpty()) {
                message += 'Proszę uzuepłnij pole email.<br>';
            } else {
                if (!validateEmail($email_field.val())) {
                    message += 'Podaj poprawny adres e-mail.<br>';
                }
            }

            if ($rating_field.length > 0) {
                var is_empty_rating_fiels = true;

                $rating_field.each(function() {
                    var $this_rating = $(this);
                    if ($this_rating.hasClass('active')) {
                        is_empty_rating_fiels = false;
                        return false;
                    }
                });

                if (is_empty_rating_fiels) {
                    message += 'Proszę wybierz ocenę tego produktu.<br>';
                }
            }


            if ($comment_field.val().isEmpty()) {
                message += 'Proszę wpisz treść komentarza.<br>';
            }

            if (!message.isEmpty()) {
                show_modal_window(message);
                return false;
            }

        });

        //Ukryj Zaznacz wszystko gdzie wszystkie produkty z listy są ukryte
        $('.check_all_products').each(function() {
            var $this = $(this);
            var this_id = $this.attr('id');
            var id = this_id.substring(this_id.lastIndexOf('_') + 1);
            var is_hide = true;
            $('.products_to_add_' + id).each(function() {
                var $this_checkbox = $(this);
                if (!($this_checkbox.parent().css('display') === 'none')) {
                    is_hide = false;
                    return false;
                }
            });
            if (is_hide) {
                $this.parent().hide();
            }
        });

        //Usuń Zaznacz wszystko, suma, Dodaj do koszyka, wiadomości do tego koszyka i ajax ikonę jeśli lista jest pusta
        //        $('li.check_all').each(function(){
        //            var $this = $(this);            
        //            if(!$this.next().is('li')){
        //                var this_id = $this.children('.check_all_products').attr('id');                
        //                var id = this_id.substring(this_id.lastIndexOf('_')+1); 
        //                var $sum_check = $('#sum_check_products_'+id);
        //                var $button_cart = $sum_check.next('.button_cart')
        //                var $ajax_loader = $button_cart.next('.ajax_loader_right')
        //                $ajax_loader.next('.cart_message').remove();
        //                $sum_check.remove();
        //                $button_cart.remove();
        //                $ajax_loader.remove();
        //                $this.remove();
        //            }
        //        });

        //Ukryj sekcje dodatków gdzie lista jest pusta lub wszystkie produkty ukryte
        $('.list_addons_products').each(function() {
            var $this = $(this);
            var $children_empty = $this.children('.products:empty');
            var $li = $this.find('li');
            var is_hide = true;
            $li.each(function() {
                var $this_li = $(this);
                if (!($this_li.css('display') === 'none')) {
                    is_hide = false;
                    return false;
                }
            });
            if ($children_empty.length > 0 || is_hide) {
                $this.hide();
            }
        });

        //Usuń Zaznacz wszystko, Dodaj do koszyka, podsumowanie kwoty jeśli brak elementów na liście
        $('.sum_check_products').each(function() {
            var $this = $(this);
            var $prev_check_all = $this.prev('.check_all');
            if ($prev_check_all.length > 0) {
                var $next_button_cart = $this.next('.button_cart');
                var $next_ajax_loader_right = $next_button_cart.next('.ajax_loader_right');
                var $next_cart_message = $next_ajax_loader_right.next('.cart_message');
                $prev_check_all.remove();
                $this.remove();
                $next_button_cart.remove();
                $next_ajax_loader_right.remove();
                $next_cart_message.remove();
            }
        });

        //usunięcie napisu proponowanych dodatków do lekcji jeśli lista jest pusta
        var $addons_lesson = $('#addons_lesson');
        if ($addons_lesson.find('.products:empty').length > 0) {
            $addons_lesson.remove();
        }

        // Listen for users clicking the show/hide details link
        // Podmiana zdarzenia z wtyczki BadgeOS aby przetłumaczyć tekst na polski
        $('#badgeos-achievements-container,.badgeos-single-achievement').off('click', '.badgeos-open-close-switch a');
        $('#badgeos-achievements-container,.badgeos-single-achievement').on('click', '.badgeos-open-close-switch a', function(event) {

            event.preventDefault();

            var link = $(this);

            if ('close' == link.data('action')) {
                link.parent().siblings('.badgeos-extras-window').slideUp(300);
                link.data('action', 'open').prop('class', 'show-hide-open').text('Pokaż szczegóły');
            } else {
                link.parent().siblings('.badgeos-extras-window').slideDown(300);
                link.data('action', 'close').prop('class', 'show-hide-close').text('Ukryj szczegóły');
            }

        });

        //przewiń na stronie głównej do sekcji Kategorie        
        $('.scroll_down').click(function() {
            var top_category = $('#category_products_main_page').offset().top + 'px';
            $('html, body').animate({
                scrollTop: top_category
            }, 500);
            return false;
        });


        function is_unique_element_in_array(element, array) {
            var is_unique = true;
            for (var i = 0; i < array.lenght; i++) {
                if (element == array[i]) {
                    is_unique = false;
                }
            }
            return is_unique;
        }



        $('#main-menu-mobile button').click(function() {
            var menuDesktop = $('#main-menu-desktop-no-main-page');
            if (menuDesktop.css('display') === 'block') {
                menuDesktop.css('display', 'none');
            } else {
                menuDesktop.css('display', 'block');
            }
        });

        //prośba o wypłatę prowizji
        $('#send_ask_payment').click(function() {
            var $this = $(this);
            if (!$this.is(':disabled')) {
                $this.prop('disabled', true);
                $('.user_information').remove();
                var $ajax_loader = $this.next('.ajax_loader');
                $ajax_loader.show();
                $.ajax({
                    type: 'POST',
                    dataType: 'text',
                    data: {
                        send_ask_payment: 'yes'
                    },
                    success: function(data) {
                        $ajax_loader.hide();
                        var result = 'Nie udało się wysłać prośby o wypłatę prowizji. Jeśli komunikat się powtarza, to napisz do nas o swoim problemie na stronie Kontakt. Dziękujęmy!';
                        if (data === 'small') {
                            result = 'Nie możesz wypłacić prowizji, bo Twoja kwota nagromadzonej prowizji do wypłaty jest niższa niż wymagany próg do wypłacania prowizji.';
                            $this.prop('disabled', true);
                        } else if (data === 'yes') {
                            result = 'Twoja prośba o wypłacenie prowizji została wysłana.';
                            $this.prop('disabled', true);
                        } else {
                            $this.prop('disabled', false);
                        }
                        $this.after('<p class="user_information">' + result + '</p>');

                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        $this.prop('disabled', false);
                        $ajax_loader.hide();
                        var result = 'Coś poszło nie tak. Jeśli komunikat się powtarza, to napisz do nas o swoim problemie na stronie Kontakt. Dziękujęmy!';
                        $this.after('<p class="user_information">' + result + '</p>');
                    }
                });
            }
        });

        //wybór danych partnera
        $('#select_partner').change(function() {
            var $this = $(this);
            $('.admin_information').remove();
            var $ajax_loader = $this.next('.ajax_loader');
            $ajax_loader.show();
            var $partner_paymenet_fields = $('#partner_paymenet_fields');
            var $send_payement = $('#send_payement');
            $partner_paymenet_fields.empty();
            $partner_paymenet_fields.hide();
            $send_payement.hide();
            $.ajax({
                type: 'POST',
                dataType: 'html',
                data: {
                    select_partner: $this.val(),
                    change_partner: 'yes'
                },
                success: function(data) {
                    $ajax_loader.hide();
                    if (data !== '') {
                        $partner_paymenet_fields.html(data);
                        $partner_paymenet_fields.show();
                        $send_payement.show();
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    $ajax_loader.hide();
                }
            });
        });

        //wypłata prowizji       
        $('#send_payement > button').click(function() {
            var $this = $(this);
            $this.prop('disabled', true);
            $('.admin_information').remove();
            var $ajax_loader = $this.next('.ajax_loader');
            $ajax_loader.show();
            $.ajax({
                type: 'POST',
                dataType: 'json',
                data: {
                    select_partner: $('#select_partner').val(),
                    value_payment: $('#value_payment').val()
                },
                success: function(data) {
                    $this.prop('disabled', false);
                    $ajax_loader.hide();
                    $this.after('<p class="admin_information">' + data[0] + '</p>');
                    if (data[1] && data[2]) {
                        $('#paid_commission_info').empty().html(data[1]);
                        $('#not_paid_commission_info').empty().html(data[2]);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    $this.prop('disabled', false);
                    $ajax_loader.hide();
                    var result = 'Coś poszło nie tak. Jeśli komunikat się powtarza, to napisz do nas o swoim problemie na stronie Kontakt. Dziękujęmy!';
                    $this.after('<p class="admin_information">' + result + '</p>');
                }
            });
        });

        $('#activate_partner').click(function() {
            var $this = $(this);
            $('.admin_information').remove();
            var $ajax_loader = $this.next('.ajax_loader');
            $ajax_loader.show();
            $.ajax({
                type: 'POST',
                dataType: 'text',
                data: {
                    activate_partner: 'yes'
                },
                success: function(data) {
                    $ajax_loader.hide();
                    if (data === '') {
                        $this.after('<p class="admin_information">Tylko administrator może ponownie uczynić Cię partnerem.</p>');
                    } else {
                        window.location.href = data;
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    $ajax_loader.hide();
                    var result = 'Coś poszło nie tak. Jeśli komunikat się powtarza, to napisz do nas o swoim problemie na stronie Kontakt. Dziękujęmy!';
                    $this.after('<p class="admin_information">' + result + '</p>');
                }
            });
        });

        /* shortcode acc_reg */

        $('.register_account > button').click(function() {
            var $this = $(this);
            var $user_information = $('.user_information');
            $user_information.empty();
            var $ajax_loader = $this.next('.ajax_loader');
            $ajax_loader.show();
            $.ajax({
                type: 'POST',
                dataType: 'text',
                data: {
                    reg_acc_user_login: $this.parent().find('[name="reg_acc_user_login"]').val(),
                    reg_acc_user_email: $this.parent().find('[name="reg_acc_user_email"]').val(),
                    reg_acc_user_pass: $this.parent().find('[name="reg_acc_user_pass"]').val(),
                    reg_acc_user_telephone: $this.parent().find('[name="reg_acc_user_telephone"]').val()
                },
                success: function(data) {
                    $ajax_loader.hide();
                    $user_information.text(data);
                    var redirect_url = $this.parent().find('[name="redirect_url"]').val();
                    if (redirect_url !== '' && data === 'Twoje konto zostało utworzone.') {
                        window.location.href = redirect_url;
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    $ajax_loader.hide();
                    var result = 'Coś poszło nie tak. Jeśli komunikat się powtarza, to napisz do nas o swoim problemie na stronie Kontakt. Dziękujęmy!';
                    $user_information.text(result);
                }
            });
        });

        /* blog hover thumbail i title */

        $('.thumbnail_image > img').hover(
            function() {
                var $this = $(this);
                var $title_blog = $this.parents('.article').find('h2.title_blog > a');
                $this.css('opacity', 0.5);
                var main_color = $('.button').css('backgroundColor');
                $title_blog.css('color', main_color);
            },
            function() {
                var $this = $(this);
                var $title_blog = $this.parents('.article').find('h2.title_blog > a');
                $this.css('opacity', 1);
                var text_color = $this.parents('.article').find('.excerpt').css('color');
                $title_blog.css('color', text_color);
            }
        );

        $('h2.title_blog > a').hover(
            function() {
                var $this = $(this);
                var $thumbnail_image = $this.parents('.article').find('.thumbnail_image > img');
                $thumbnail_image.css('opacity', 0.5);
                var main_color = $('.button').css('backgroundColor');
                $this.css('color', main_color);
            },
            function() {
                var $this = $(this);
                var $thumbnail_image = $this.parents('.article').find('.thumbnail_image > img');
                $thumbnail_image.css('opacity', 1);
                var text_color = $this.parents('.article').find('.excerpt').css('color');
                $this.css('color', text_color);
            }
        );

        /* Test szybkość czytania */
        var $opcje_speed_test = $('.opcje_speed_test .opcja');
        $opcje_speed_test.click(function() {
            var $this = $(this);
            if (!$this.hasClass('wybrane')) {
                $opcje_speed_test.removeClass('wybrane');
                $this.addClass('wybrane');
            }
        });

        $('#ile_stron_send').click(function() {
            if ($opcje_speed_test.hasClass('wybrane')) {
                var $wybrana = $('.opcje_speed_test .opcja.wybrane');
                var $this = $(this);
                var $ajax_loader = $('#ajax_loader_speed_test');
                var opcja = '';
                var ile_stron = '';

                if ($wybrana.hasClass('opcja1')) {
                    opcja = 1;
                } else {
                    if ($wybrana.hasClass('opcja2')) {
                        opcja = 2;
                    } else {
                        if ($wybrana.hasClass('opcja3')) {
                            opcja = 3;
                            ile_stron = $('.ile_stron').val();
                        }
                    }
                }

                if (opcja >= 1 && opcja <= 3) {
                    $this.hide();
                    $ajax_loader.show();

                    $.ajax({
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            opcja_speed_test: opcja,
                            ile_stron_speed_test: ile_stron
                        },
                        success: function(data) {
                            $ajax_loader.hide();
                            $this.show();
                            show_modal_window(data[1]);
                            if (data[0] === 1 && $this.data('redirect') !== '') {
                                $('.modal_window .ok_button').unbind('click');
                                $background_modal_window.on('click', '.modal_window .ok_button', function() {
                                    window.location.href = $this.data('redirect');
                                });
                            }
                        },
                        error: function(jqXHR, textStatus, errorThrown) {
                            $ajax_loader.hide();
                            $this.show();
                            show_modal_window('Coś poszło nie tak. Jeśli błąd się powtarza to proszę skontaktuj się z nami.');
                        }
                    });
                }
            } else {
                show_modal_window('Wybierz jedną z opcji.');
            }

        });

        var $all_user_badges = $('.all_user_badges');
        var $badge_record = $all_user_badges.children('.badge_record');
        var amount_bagdes = $badge_record.length;
        if (amount_bagdes > 1) {

            $all_user_badges.parent().css('float', 'left');
            var $arrow_left_box = $all_user_badges.parent().parent().children('.arrow_left');
            $arrow_left_box.show();

            var $arrow_right_box = $all_user_badges.parent().parent().children('.arrow_right')
            $arrow_right_box.show();

            var width_box = $badge_record.first().width();
            var margin_right = parseInt($badge_record.first().first().css('marginRight'));
            var step = width_box + margin_right;
            var width_all_user_badges = width_box * amount_bagdes + margin_right * (amount_bagdes - 1);
            $all_user_badges.width(width_all_user_badges);

            var index_badge = 0;

            $('img', $arrow_left_box).click(function() {
                if (index_badge === 0 || $all_user_badges.is(':animated')) {
                    return;
                }
                index_badge++;
                $all_user_badges.animate({
                    'left': index_badge * step
                });
            });

            $('img', $arrow_right_box).click(function() {
                if ((Math.abs(index_badge) >= (amount_bagdes - 1)) || $all_user_badges.is(':animated')) {
                    return;
                }
                index_badge--;
                $all_user_badges.animate({
                    'left': index_badge * step
                });
            });
        }

        //pokazanie okna modalnego z informacją o zdobyciu odznaki i ewentualnych punktów
        $('body').on('click', '#show_window_earned_badge', function() {
            var $this = $(this);
            show_modal_window($this.html());
            //            $this.remove();
        });

        function Notes($note) {
            var obj_now = this;
            this.$note = $note;
            this.count_all_records = parseInt(this.$note.children('[name="count_all_records"]').val());

            this.$list_container = this.$note.children('.list_container');
            this.$list_ul = this.$list_container.children('ul');
            this.$list_li = this.$list_ul.children('li');

            this.$list_prev = this.$note.find('.list_prev');
            this.$list_next = this.$note.find('.list_next');

            this.height_wrapper = this.$note.parent().height() - this.$note.parent().children('p').outerHeight(true);

            this.height_list_element = this.$list_li.outerHeight() - 1;
            this.list_actual_element = 1;
            this.count_list_all_elements = this.$list_li.length;
            this.count_list_visible_elements = 1;
            this.list_actual_top = 0;

            this.offset = 20;
            this.limit = 20;
            this.count_posts_before_load = 5;
            this.is_load_more = true;
            this.is_no_actual_load = true;

            this.init = function() {
                if (this.$list_container.is(':visible')) {
                    this.$list_li = this.$list_ul.children('li');
                    this.count_list_all_elements = this.$list_li.length;
                    this.height_wrapper = this.$note.parent().height() - this.$note.parent().children('p').outerHeight(true);
                    var height_container = 0;
                    var is_show_button = false;
                    this.count_list_visible_elements = 0;

                    this.$list_li.each(function() {
                        var $this = $(this);
                        obj_now.count_list_visible_elements++;
                        height_container += $this.outerHeight();
                        if (height_container > obj_now.height_wrapper) {
                            height_container -= 2 * $this.outerHeight();
                            obj_now.count_list_visible_elements -= 2;
                            is_show_button = true;
                            return false;
                        }
                    });

                    if (this.count_list_visible_elements < 1) {
                        this.count_list_visible_elements = 1;
                        height_container = this.$list_li.first().outerHeight();
                        if (this.count_list_all_elements < 2) {
                            is_show_button = false;
                        }
                    }

                    if (this.count_all_records > this.count_list_visible_elements) {
                        is_show_button = true;
                    }

                    this.$list_container.height(height_container);

                    if (is_show_button) {
                        this.$list_prev.show();
                        this.$list_next.show();
                    } else {
                        this.$list_prev.hide();
                        this.$list_next.hide();
                        this.list_actual_element = 1;
                        this.list_actual_top = 0;
                        this.$list_ul.css('top', this.list_actual_top);
                    }
                }
            };

            this.$list_prev.click(function() {
                if (obj_now.list_actual_element < 2) {
                    return;
                }
                obj_now.list_actual_element--;
                obj_now.list_actual_top += obj_now.height_list_element;
                obj_now.$list_ul.animate({
                    top: obj_now.list_actual_top
                });
            });

            this.$list_next.click(function() {
                if (obj_now.is_load_more && obj_now.is_no_actual_load && (obj_now.list_actual_element + obj_now.count_list_visible_elements + obj_now.count_posts_before_load) > obj_now.count_list_all_elements) {
                    obj_now.is_no_actual_load = false;
                    $.ajax({
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            notes_offset: obj_now.offset,
                            notes_limit: obj_now.limit
                        },
                        success: function(data) {
                            if (data['list_notes'] !== undefined && data['list_notes'] !== '' &&
                                data['full_notes'] !== undefined && data['full_notes'] !== ''
                            ) {
                                obj_now.$list_ul.append(data['list_notes']);
                                obj_now.$note.append(data['full_notes']);
                                obj_now.$list_li = obj_now.$list_ul.children('li');
                                obj_now.count_list_all_elements = obj_now.$list_li.length;
                                obj_now.offset += obj_now.limit;
                                obj_now.is_no_actual_load = true;
                            } else {
                                obj_now.is_load_more = false;
                            }
                        },
                        error: function() {
                            console.log('Nie udało się załadować wpisów');
                        }
                    });
                }
                if ((obj_now.list_actual_element + obj_now.count_list_visible_elements) > obj_now.count_list_all_elements) {
                    return;
                }
                obj_now.list_actual_element++;
                obj_now.list_actual_top -= obj_now.height_list_element;
                obj_now.$list_ul.animate({
                    top: obj_now.list_actual_top
                });
            });

            this.$list_ul.on('click', 'li .title_note', function() {
                var $this = $(this);
                obj_now.$list_container.hide();
                obj_now.$list_prev.hide();
                obj_now.$list_next.hide();
                obj_now.$note.find($('[data-id="' + $this.attr('data-id') + '"]')).fadeIn();
            });

            this.$note.on('click', '.return_notes', function() {
                obj_now.$full_note = obj_now.$note.children('.full_note');
                obj_now.$full_note.hide();
                obj_now.$list_container.fadeIn();
                obj_now.init();
            });
        }

        var note = new Notes($('#list_notes'));
        note.init();

        //animowanie przewinięcia strony do kotwicy
        var $root = $('html, body');
        $(document).on('click', 'a', function(event) {
            var $this = $(this);
            var href = $this.attr('href');
            var pattern_anchor = /^#[a-zA-Z]+[a-zA-Z0-9-_]*$/;
            var is_anchor = pattern_anchor.test(href);
            if (is_anchor) {
                var $anchor_element = $(href);
                if ($anchor_element.length) {
                    event.preventDefault();
                    $root.animate({
                        scrollTop: $anchor_element.offset().top
                    }, 500);
                }
            }
        });

        //podmiana domyślnego checkboxa na własny
        $(document).on('click', '.checkbox', function() {
            var $this = $(this);
            $this.toggleClass('checked');
            var $checkbox_input = $this.siblings('input[type="checkbox"]');
            if ($checkbox_input.length) {
                if ($checkbox_input.is(':checked')) {
                    $checkbox_input.prop('checked', false);
                } else {
                    $checkbox_input.prop('checked', true);
                }
            }
        });

        window.onload = function() {
            $('#show_window_earned_badge').click();
        };

        $(window).resize(function() {
            var $this = $(this);
            $('body').css('overflow', 'hidden');
            widthPage = parseInt($this.width());
            var menuDesktop = $('#main-menu-desktop');

            if (widthPage > 1279 /*wartość do ustawienia zależna od danych w CSS*/ ) {
                menuDesktop.css('display', 'block');
            } else {
                menuDesktop.css('display', 'none');
            }
            $('body').css('overflow', 'auto');

            var window_height = set_dimensions_background_modal_window_first_step();
            if ($modal_window.is(':visible')) {
                set_position_modal_window(window_height, distance_from_top, min_distance_from_bottom);
            }
            note.init();
            //            reload_relocation_columns();            
            //            render_background_addons($background_addons_products, widthPage);        
        });

        $(window).resize();

    });
})(jQuery);