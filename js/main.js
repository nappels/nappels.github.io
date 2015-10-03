/* JS goes here */

Store = {};
Store.Utils = {
    ajaxRequest: function(url, type, data, callback) {
        var xmlhttp;
        callback = callback || function() {};

        if (window.XMLHttpRequest) {
            // code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp = new XMLHttpRequest();
        } else {
            // code for IE6, IE5
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }

        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
               if(xmlhttp.status == 200){
                   callback(xmlhttp);
               }
               else if(xmlhttp.status == 400) {
                  console.error('There was an error 400');
               }
               else {
                 console.error('There was a general error');
               }
            }
        }

        xmlhttp.open(type, url, true);
        xmlhttp.send();
    },

    urlParams: function() {
        var urlParams;
        var match,
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query  = window.location.search.substring(1);

        urlParams = {};
        while (match = search.exec(query)) {
            urlParams[decode(match[1])] = decode(match[2]);
        }

        return urlParams;
    }
};

Store.View = {
    productSelectorEl: document.getElementById("product-selector"),
    productViewEl: document.getElementById("product-view"),
    productData: {},

    init: function(pageId) {
        var self = this;
        this.productId = pageId || 1;

        Store.Utils.ajaxRequest("/products.json", "GET", null, function(data) {
            self.productData = self.formatData(data);

            // One time rendering of product selector based on product data response
            self.renderProductSelector(data);

            self.updateView(self.productId);
        });
    },

    formatData: function(data) {
        var table = {};
        data = JSON.parse(data.responseText);
        for (var i = 0; i < data.length; i++) {
            table[i+1] = {
                title: data[i].title,
                productImageUrl: data[i].product_image_url
            };
        }
        return table;
    },

    updateView: function(id) {
        this.fadeOutView();
        this.renderProductTitle(id);
        this.setCurrentDetailView(id);
        this.scrollProductSelector(id);
        this.renderProductImage(id);
        this.fadeInView();
    },

    renderProductSelector: function(data) {
        var shirtData = JSON.parse(data.responseText);

        for (var i = 0; i < shirtData.length; i++) {
            this.renderProductSelectorDetail(shirtData[i].id);
        }
    },

    renderProductSelectorDetail: function(id, title, productImageUrl) {
        // Create the product selector detail elements and insert into DOM
        var productDetailWrapper = document.createElement("div");
        productDetailWrapper.className = 'product-detail-wrapper';
        productDetailWrapper.setAttribute('data-id', id);

        // explicitly using == to coerce this.productId to number
        if (id == this.productId) {
            productDetailWrapper.className += ' active';
        }

        var productDetail = document.createElement("div");
        productDetail.className = 'product-detail';

        var productId = document.createElement("div");
        productId.className = 'product-id';
        productId.appendChild(document.createTextNode(id));

        productDetailWrapper.appendChild(productDetail);
        productDetailWrapper.appendChild(productId);
        this.productSelectorEl.appendChild(productDetailWrapper);

        this.setupClickEvent(productDetailWrapper);
    },

    setupClickEvent: function(el) {
        el.addEventListener('click', function(e) {
            if (e.path && e.path.length > 0) {
                    // Bubble click up to get data-id on .product-detail-wrapper element
                    for (var i = 0; i < e.path.length; i++) {
                        if (e.path[i].className === 'product-detail-wrapper') {
                            Store.Router.navigate(e.path[i].getAttribute('data-id'));
                        }
                    }
            }
        }, false);
    },

    renderProductTitle: function(id) {
        var headerEl = document.getElementsByClassName('product-header');
        var headerText = id + '. ' + this.productData[id].title;

        headerEl[0].innerHTML = '';
        headerEl[0].appendChild(document.createTextNode(headerText));
    },

    renderProductImage: function(id) {
        var img = document.querySelectorAll('.product-img img');
        img[0].setAttribute('src', this.productData[id].productImageUrl);
    },

    setCurrentDetailView: function(id) {
        var productDetailWrapperEls = document.getElementsByClassName('product-detail-wrapper');

        for (var i = 0; i < productDetailWrapperEls.length; i++) {
            if (productDetailWrapperEls[i].classList.contains('active')) {
                productDetailWrapperEls[i].classList.remove('active');
            }
            if (id == productDetailWrapperEls[i].getAttribute('data-id')) {
                productDetailWrapperEls[i].className += ' active';
            }
        }
    },

    scrollProductSelector: function(id) {
        var currentEl = document.querySelectorAll('.product-detail-wrapper[data-id="' + id + '"]');
        if (currentEl[0]) {
            this.productSelectorEl.scrollLeft = currentEl[0].offsetLeft - 70;
        }
    },

    fadeOutView: function() {
        this.productViewEl.classList.remove('show');
    },

    fadeInView: function() {
        this.productViewEl.classList.add('show');
    }
};

Store.Router = {
    init: function() {
        var pageId = Store.Utils.urlParams().id;
        Store.View.init(pageId);
        this.setupEvents();
    },

    navigate: function(id) {
        if (history.pushState) {
            history.pushState({}, 'Product - ' + id, '/?id=' + id);
            Store.View.updateView(id);
        }
        else {
            window.location = '/?id=' + id;
        }
    },

    setupEvents: function() {
        // Listen to back and forward buttons, and update view
        window.onpopstate = function() {
            var pageId = Store.Utils.urlParams().id || 1;
            Store.View.updateView(pageId);
        };
    }
};

Store.Router.init();
