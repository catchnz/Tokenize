/**
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * This software consists of voluntary contributions made by many individuals
 * and is licensed under the new BSD license.
 *
 * @author      David Zeller <zellerda01@gmail.com>
 * @license     http://www.opensource.org/licenses/BSD-3-Clause New BSD license
 */
(function($, tokenize){

    $.tokenize = function(opts){

        if(opts == undefined){
            opts = $.fn.tokenize.defaults;
        }

        this.options = opts;
    };

    $.extend($.tokenize.prototype, {

        init: function(element){

            this.el = element;
            this.el.attr('multiple', 'multiple').hide();
            this.createHtml();

        },

        createHtml: function(){

            var $this = this;
            this.mouseOnContainer = false;
            this.tokenDelete = false;
            
            this.el.css({ margin : 0, padding: 0, border: 0});

            // Container div
            this.container = $('<div />')
                .addClass('Tokenize')
                .width(this.el.width());

            // Dropdown
            this.dropdown = $('<ul />')
                .addClass('Dropdown');

            // List container
            this.tokens = $('<ul />')
                .addClass('Tokens')
                .width(this.el.width());

            // List item search
            this.searchItem = $('<li class="SearchField" />');

            // Search input
            this.searchInput = $('<input />')
                .attr('maxlength', this.options.maxChars);

            // Add to HTML
            this.searchItem.append(this.searchInput);
            this.tokens.append(this.searchItem);
            this.container
                .append(this.tokens)
                .append(this.dropdown)
                .insertAfter(this.el);

            this.updateInput();
            this.fillDefaults();

            if(this.options.datas == 'select')
            {
                this.searchInput.bind('click focus', function(){
                    if(!$this.tokenDelete){
                        $this.cleanPendingDelete();
                        $this.fillDropdown();
                        $this.showDropdown();
                    } else {
                        $this.tokenDelete = false;
                    }
                });
            }

            this.tokens.bind('click', function(){
                $this.searchInput.get(0).focus();
            });

            $(document).bind('click', function(){
                if(!$this.mouseOnContainer){
                    $this.closeDropdown();
                }
            });

            this.searchInput.on('paste', function(e){
                setTimeout(function(){ $this.updateInput(); }, 10);
            });

            this.searchInput.bind('keydown', function(e){
                $this.updateInput();
                $this.keydown(e);
            });

            this.searchInput.bind('keyup', function(e){
                $this.keyup(e);
            });

            this.container.bind('mouseenter', function(){
                $this.mouseOnContainer = true;
            });

            this.container.bind('mouseleave', function(){
                $this.mouseOnContainer = false;
            });

        },

        fillDefaults: function(){

            var $this = this;

            $('option:selected', this.el).each(function(){
                $this.addToken($(this));
            });

        },

        showDropdown: function(){

            this.dropdown.show()
                .width(this.tokens.width())
                .css('top', this.tokens.outerHeight() - this.tokens.pixels('border-top-width'));
            
            this.updateDropdown();

        },

        fillDropdown: function(){

            this.cleanDropdown();
            var $this = this;

            $('option', this.el).not(':selected').each(function(){
                $this.addDropdownItem($(this).val(), $(this).html());
            });

        },

        cleanDropdown: function(){

            this.dropdown.html('');

        },

        updateDropdown: function(){

            var item_count = 0, item_height = 0;

            $('li', this.dropdown).each(function(){
                item_count++;
            });

            if(item_count > 0){
                if(item_count >= this.options.size){
                    item_height = $('li:first-child', this.dropdown).outerHeight();
                    this.dropdown.height(item_height * this.options.size);
                } else {
                    this.dropdown.height('inherit');
                }
            } else {
                this.closeDropdown();
            }

        },

        closeDropdown: function(clean){

            if(clean == undefined){
                clean = true;
            }

            this.dropdown.hide();

            if(clean){
                this.cleanDropdown();
            }

        },

        addDropdownItem: function(key, label){

            if($('li[data="' + key + '"]', this.tokens).length){
                return false;
            }

            var item = $('<li />'), $this = this;

            item.attr('data', key)
                .html(label)
                .bind('click', function(){
                    $this.addToken($(this));
            }).bind('mouseover', function(){
                $(this).addClass('Highlight');
            }).bind('mouseout', function(){
                $('li', $this.dropdown).removeClass('Highlight');
            });

            this.dropdown.append(item);

        },

        cleanInput: function(){

            this.searchInput.val('');
            this.updateInput();

        },

        cleanPendingDelete: function(){

            $('li.PendingDelete', this.tokens).removeClass('PendingDelete');

        },

        addToken: function(el){

            var token = $('<li />'),
                close = $('<a />'),
                is_new = false,
                $this = this;

            if($('option[value="' + el.attr('data') + '"]', this.el).length){
                $('option[value="' + el.attr('data') + '"]', this.el).attr('selected', 'selected');
            } else if(!el.is('option')) {
                var option = $('<option />')
                    .attr('selected', 'selected')
                    .attr('value', el.attr('data'))
                    .attr('data', 'custom')
                    .html(el.html());

                this.el.append(option);
                is_new = true;
            }

            close.html('×')
                .addClass('Close')
                .bind('click', function(){
                    $this.removeToken(token, true);
            });

            token.addClass('Token');

            if(el.is('option')){
                token.attr('data', el.attr('value'));
            } else {
                token.attr('data', el.attr('data'));
            }

            token.append('<span>' + el.html() + '</span>')
                .prepend(close)
                .insertBefore(this.searchItem);

            if(is_new){
                this.options.onTokenNew(el);
            } else {
                this.options.onTokenAdd(el);
            }

            this.cleanInput();
            this.closeDropdown();

        },

        removeToken: function(token, disable_click){

            if(disable_click == undefined){
                disable_click = false;
            }

            var option = $('option[value="' + token.attr('data') + '"]', this.el);

            if(option.attr('data') == 'custom'){
                option.remove();
            } else {
                option.removeAttr('selected');
            }

            token.remove();
            this.options.onTokenRemove(token);

            this.updateInput();
            this.closeDropdown();

            if(disable_click){
                this.tokenDelete = true;
            }

        },

        updateInput: function(){

            if($('li.Token', this.tokens).length > 0){

                this.searchFieldScale();

            } else {
                // Change input width
                this.searchInput.width(
                    this.tokens.width() -
                    this.searchInput.pixels('padding-left') -
                    this.searchInput.pixels('padding-right')
                );
            }

        },

        searchFieldScale: function(){

            var measure = $('<div />'), margins;

            measure.css({ position: 'absolute', visibility: 'hidden' })
                .addClass('TokenizeMeasure')
                .html(this.searchInput.val());

            $('body').append(measure);

            margins = this.searchInput.pixels('padding-left') + this.searchInput.pixels('padding-right');
            this.searchInput.width(measure.width() + 25 - margins);

            measure.remove();

        },

        keydown: function(e){

            if(e.keyCode == this.options.validator){
                e.preventDefault();
                this.addCustomToken();
            } else {
                switch(e.keyCode){
                    // Delete
                    case 8:
                        if(this.searchInput.val().length == 0){
                            e.preventDefault();
                            if($('li.Token.PendingDelete', this.tokens).length){
                                this.removeToken($('li.Token.PendingDelete'));
                            } else {
                                $('li.Token:last', this.tokens).addClass('PendingDelete');
                            }

                            this.closeDropdown();
                        }
                        break;

                    // Return
                    case 9:
                    case 13:
                        e.preventDefault();
                        if($('li.Highlight', this.dropdown).length){
                            this.addToken($('li.Highlight', this.dropdown));
                        } else {
                            this.addCustomToken();
                        }
                        this.cleanPendingDelete();
                        break;

                    // ESC
                    case 27:
                        this.cleanInput();
                        this.closeDropdown();
                        this.cleanPendingDelete();
                        break;

                    // Go up
                    case 38:
                        e.preventDefault();
                        this.goUp();
                        break;

                    // Go down
                    case 40:
                        e.preventDefault();
                        this.goDown();
                        break;

                    default:
                        this.cleanPendingDelete();
                        break;
                }
            }

        },

        keyup: function(e){
            
            if(e.keyCode != this.options.validator){
                switch(e.keyCode){
                    case 9:
                    case 13:
                    case 27:
                    case 38:
                    case 40:
                        break;

                    case 8:
                        if(this.searchInput.val()){
                            this.search();
                        } else {
                            this.closeDropdown();
                        }
                        break;
                    default:
                        this.search();
                        break;
                }
            }

        },

        addCustomToken: function(){

            if(this.options.newElements && this.searchInput.val()){
                if($('li[data="' + this.searchInput.val() + '"]', this.tokens).length){
                    this.cleanInput();
                    return false;
                }

                var li = $('<li />')
                    .attr('data', this.searchInput.val())
                    .html(this.searchInput.val());

                this.addToken(li);
                this.closeDropdown();
            } else {
                this.cleanInput();
            }

        },

        goUp: function(){

            if($('li.Highlight', this.dropdown).length > 0){
                if(!$('li.Highlight').is('li:first-child')){
                    $('li.Highlight').removeClass('Highlight').prev().addClass('Highlight');
                }
            } else {
                $('li:first', this.dropdown).addClass('Highlight');
            }
        },

        goDown: function(){

            if($('li.Highlight', this.dropdown).length > 0){
                if(!$('li.Highlight').is('li:last-child')){
                    $('li.Highlight').removeClass('Highlight').next().addClass('Highlight');
                }
            } else {
                $('li:first', this.dropdown).addClass('Highlight');
            }
        },

        search: function(){

            var $this = this;

            if(this.options.datas == 'select'){
                var found = false,
                    regexp = new RegExp($this.searchInput.val().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), 'i');

                this.cleanDropdown();

                $('option', this.el).not(':selected').each(function(){
                    if(regexp.test($(this).html())){
                        $this.addDropdownItem($(this).attr('value'), $(this).html());
                        found = true;
                    }
                });

                if(found){
                    this.showDropdown();
                    $('li:first', this.dropdown).addClass('Highlight');
                    this.updateDropdown();
                } else {
                    this.closeDropdown();
                }
            } else {
                $.getJSON(this.options.datas, this.options.searchParam + "=" + this.searchInput.val(), function(data){
                    if(data){
                        $this.cleanDropdown();

                        $.each(data, function(key, val){
                            $this.addDropdownItem(key, val);
                        });

                        $this.showDropdown();
                        $('li:first', $this.dropdown).addClass('Highlight');
                        $this.updateDropdown();
                    } else {
                        $this.closeDropdown();
                    }
                });
            }
        }

    });

    $.fn.tokenize = function(options){

        if(options == undefined){
            options = {};
        }

        var opt = $.extend({}, $.fn.tokenize.defaults, options);
        var obj = new $.tokenize(opt);
        obj.init(this);

        $(this).data('tokenize', obj);

        return this;

    };

    $.fn.tokenize.defaults = {

        datas: 'select',
        searchParam: 'search',
        validator: 188,
        newElements: true,
        size: 10,
        maxChars: 50,

        onTokenAdd: function(token){},
        onTokenNew: function(token){},
        onTokenRemove: function(token){}

    };

    $.fn.pixels = function(property) {

        return parseInt(this.css(property).slice(0,-2));

    };

})(jQuery, 'tokenize');