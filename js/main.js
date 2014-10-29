(function() {
    'use strict'

    // Create a save reference to the movieApp
    var movieApp = function(obj) {
        if (obj instanceof movieApp) return obj;
        if (!(this instanceof movieApp)) return new movieApp(obj);
        this.movieAppwrapped = obj;
    };
    // Add some info to the movieApp. 
    this.movieApp = movieApp;

    movieApp.version = 0.1;

    // settings for MovieApp
    var settings = {
        url: 'http://dennistel.nl/movies'
    };    
    
    /* ---HELPERS--- */

    // Check if something exist
    function exists(x) { return x !== null; }    

    // Returns true if @x is not false and not null
    function truth(x) { return (x !== false) && exists(x); }

    //error message
    function fail(thing) { throw new Error(thing); }

    // if you get something out a function
    function get(x) { return x; }

     // Calls the function @action1 when @condition is met and @action2 if it is not.
    function doWhen(condition, action1, action2, params) {         
        return truth(condition) ? action1(params) : action2(params);
    }    
    // Returns an instantiation of object @Target if it exists in the environment.
    function instantiateIfExists(Target) {
        return doWhen(exists(Target), function () {
            return new Target();
        });
    }    
      
    // Hash change
    function hashChange(route) {
        location.hash = '/'+ route +'/';
    }

    /* HTML DOM ELEMENTS */

    // Add class from element
    function addClass(el, className) {        
        el.className += className;
    }
    
    // Remove class from element
    function removeClass(el, className) {        
        el.className = el.className.replace(className, '');
    }
    
    // Toggle Class on element with given options.el and options.className
    function toggleClass(el, options) {       
        (options.el.className.indexOf(options.className) == -1) ? addClass(options.el, options.className) : removeClass(options.el, options.className);         
    }    
    
    // Get attribute
    function getAttr(el, attr) {
        return (exists(el)) ? el.getAttribute(attr) : fail('element not exist'+el);
    }

    // Toggle Attribute 
    function toggleAttribute(el, attr, value) {
        (el.getAttribute(attr) !== value) ? el.setAttribute(attr, value) : el.setAttribute(attr, '');
    }
    // Get element and return function
    function getEl(target, all) {      
        return function(fn) {            
            if(all === true) {
                return (exists(document.querySelector(target))) ? fn(document.querySelectorAll(target)) : fail('element is not found'+ target);  
            } else {
                return (exists(document.querySelector(target))) ? fn(document.querySelector(target)) : fail('element is not found'+ target);  
            }
        }          
    }

    // Print html to element in dom
    function printHtml(el) {                
        return function(html) {                   
            el.innerHTML = html;
        }
    }

    // Get html from element
    function getHtml(el) {
         return el.innerHTML;
    }

     // Compare elements attribute with value
    function compareAttribute(elements, value, compare) {
        return _.map(elements, function(item) {                          
                return (item.className == compare) ? item.getAttribute(value) : false;            
            return item;
        });
    }

    /* ---REQUEST--- */

    // Returns a request object that can read files based on the users browser environment
    function chooseRequestObject() {
        return instantiateIfExists(window.XMLHttpRequest) || instantiateIfExists(window.ActiveXObject) || fail("Your platform doesn't support HTTP request objects");
    }
    function readFileContents(url) {
        var request = chooseRequestObject();
        request.open("GET", url, false);    
        request.send(null);                                   
        (exists(request.responseText)) ? setData(url, request.responseText) : false;          
        return JSON.parse(request.responseText);
    }

    
    // Set data in local storage
    function setData(url, data) {
        localStorage.setItem(url, data);
    }

    // Get data from localstorage if exsist if not: do an request
    function getData(url) {        
        return (localStorage.getItem(url) !== null) ? JSON.parse(localStorage.getItem(url)) : readFileContents(url);
    }

    /* ---EVENT LISTENERS--- */

    // Add event listener to an element or an parent element with childs
    function addEvent(el, type, child, fn, options) {        
                                    
        el.addEventListener(type, function(e) {                        
            if(exists(child)) {                              
                (e.target.localName == child) ? fn(e, options) : false;
            } else {
                 fn(e, options);
            }           
            return (typeof options.action !== 'undefined') ? options.action :  e.preventDefault();                
        }, false);
       
    }

    // Hammer touch event
    function touchEvent(type, el, fn) {
        var mc = new Hammer(el);        
        return function(options) {
            mc.on(type, function(ev) {           
                fn(ev, options);
            });
        }
    }

    /* ---MANUPILATE DATA */

    // Compare filter array with data type array
    function filterObject(filter, type, data) {            
        filter = _.filter(filter, function(item) {
            return (item !== false) ? item : false;
        });             
        if (filter.length < 1) { return data }
        return _.filter(data, function(item) {
            var boo = false;
            for(var i in filter) {                                
                if(_.contains(item[type], filter[i])) {
                    boo = true;
                } else {
                    boo = false;
                    break;                    
                }                                            
            }
            return (boo === true) ? item : false;            
        });    
    }

    // Sort object desc or asc
    function sortObject(data, orderby, order) {                  
        return _.sortBy(data, function(item) {
            if(order == 'desc') {
                return (!isNaN(item[orderby])) ? -item.reviews : false;
            } else {
                return (!isNaN(item[orderby])) ? +item.reviews : false;
            }
        });
    }


    /* ---MANUPILATE MOVIE DATA */

    function filter(e, options) {     
        toggleClass(e, {el: e.target, className: 'active'});       
        options.fn(
            options.template(
                {movies: filterObject(compareAttribute(getEl('.filter a', true)(get), 'data-value', 'active'), options.type, options.data)}
            )
        );        
    }

    // sort Movies by Rating
    function sortMoviesByRate(e) {
                 
        toggleAttribute(e.target, 'data-order', 'desc'); 

        setMovieHtml({
            movies: sortObject(setMovies(getData(settings.url)).movies, 'reviews', getAttr(e.target, 'data-order'))
        });       
    }

    // Set data for movies
    function setMovies(data) {            
         return {
            movies: _.map(data, function(movie, i) {            
                if(movie.reviews.length > 0) {
                    movie.reviews = _.reduce(movie.reviews, function(prev, review) {                    
                        return prev + review.score;                    
                    }, 0) / movie.reviews.length;               
                } else {
                    movie.reviews = '-';
                }
                        
                movie.genre = _.reduce(movie.genres, function(prev, val) {
                    return prev +', '+ val;
                });

                return movie;
            })            
        };
    }

    // Get genres from all movies
    function setGenres(data) {
        return {
            genres: _.reduceRight(_.pluck(data, 'genres'), function(a, b) { return _.sortBy(_.union(a, b)); }, [])
        };
    }

    /* ---PAGE HELPERS--- */
    function setMovieHtml(obj) {
         getEl('.main .movie_container')(printHtml)(
            _.template(getEl('#movies')(getHtml))(obj)
        );                
    }
    function setPageHtml(id, obj) {
         getEl('.main')(printHtml)(
            _.template(
                getEl(id)(getHtml)            
            )(obj)
        );
    }

    /* ---PAGES--- */

    // Movies page
    function movies(param) {       
        
        // set loader
        getEl('.main')(printHtml)(
            _.template(getEl('#loader')(getHtml))({})
        );

        // set data                             
        setTimeout(function() {
           
            setPageHtml('#moviesPage');
            setMovieHtml(setMovies(getData(settings.url)));
            
            // set genres
            getEl('.tools')(printHtml)(_.template(getEl('#genres')(getHtml))(setGenres(getData(settings.url))));
            setFilter();
            setOrder();
        }, 400);

    }

    // Movie Single page
    function movieSingle(param) {                
        setPageHtml('#singleMovie', getData(settings.url+'/'+param.id));
        //touch swipe back
        touchEvent('swiperight', getEl('.main')(get), hashChange)('movies');
    }

    // About page
    function about() {
        setPageHtml('#about');
    }

    /* ---PAGE EVENTS--- */
   
    function setNav() {
        addEvent(getEl('.btn_nav')(get), 'click', 'a', toggleClass, 
            {
                className: 'hide',
                el: getEl('nav.global')(get)
            }   
        );
         addEvent(getEl('nav.global')(get), 'click', 'a', toggleClass, 
            {
                className: 'hide',
                el: getEl('nav.global')(get),
                action: true
            }   
        );                    
    }

    function setFilter() {
        addEvent(getEl('.btn_filter')(get), 'click', 'a', toggleClass, 
            {
                className: 'hide',
                el: getEl('.tools')(get)
            }   
        );
        addEvent (getEl('.filter')(get), 'click', 'a', filter,                     
            {
                type: 'genres',
                data: setMovies(getData(settings.url))['movies'],
                fn:  getEl('.main .movie_container')(printHtml),
                template: _.template(getEl('#movies')(getHtml))                            
            }
        );   

        addEvent(getEl('.search')(get), 'keyup', null, search, {action: true});       
    }
    function search(e) {      
        setMovieHtml({
            movies: _.filter(setMovies(getData(settings.url))['movies'], function(item) {
                return (item.title.toLowerCase().indexOf(e.target.value.toLowerCase()) >= 0) ? item : false 
            })
        });     
    }
   
    function setOrder() {
        addEvent (getEl('.sort')(get), 'click', 'a', sortMoviesByRate, {});        
    }

    /*  ---ROUTES--- */
    // Use satnav library for routing (functional library)
    Satnav({
        html5: false, 
        force: true, 
        poll: 100 
    })
    .navigate({
        path: '/',
        directions: function(params) {                      
           setNav();
           movies();   
        }
    })
    .navigate({
        path: 'about',
        directions: function(params) {           
           about();   
        }
    })
    .navigate({
        path: 'movies/?{id}',
        directions: function(params) {                          
            doWhen(params.hasOwnProperty('id'), movieSingle, movies, params);
        }
    })
    .otherwise('/') 
    .change(function(params,old) {        
    })
    .go();

}).call(this);
