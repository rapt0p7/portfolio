'use strict';

var gulp             = require('gulp');                  // основной плагин gulp
var less             = require('gulp-less');             // препроцессор
var autoprefixer     = require('gulp-autoprefixer');     // расставление автопрефиксов
var cleanCSS         = require('gulp-csso');             // минификация css
var uglify           = require('gulp-uglify');           // минификация js
var jshint           = require('gulp-jshint');           // отслеживание ошибкок в js
var fileinclude      = require('gulp-file-include');     // работа с инклюдами в html и js
var imagemin         = require('gulp-imagemin');         // минимизация изображений
var imageminPngquant = require('imagemin-pngquant');     // дополнение к минификатору
var spritesmith      = require('gulp.spritesmith');      // объединение картинок в спрайты
var clean            = require('gulp-dest-clean');       // очистка
var sourcemaps       = require('gulp-sourcemaps');       // sourcemaps
var rename           = require('gulp-rename');           // переименвоание файлов
var plumber          = require('gulp-plumber');          // предохранитель для остановки гальпа
var concat           = require('gulp-concat');           // конкатизация
var replace          = require('gulp-replace');          // замена файлов
var watch            = require('gulp-watch');            // расширение возможностей watch
var browserSync      = require('browser-sync').create(); // лайврелоад и сервер
var size             = require('gulp-size');             // отображение размера файлов в консоли
var reporter         = require('gulp-less-reporter');    // отображение ошибок при компиляции less
var ghpages          = require('gulp-gh-pages');         // публикация на gh-pages
var svgSprite        = require('gulp-svg-sprite');       // сборка svg спрайта
var cheerio          = require('gulp-cheerio');
var svgmin           = require('gulp-svgmin');
var newer            = require('gulp-newer');
var notify           = require('gulp-notify');           // вывод уведомлений
var merge            = require('merge-stream');
var buffer           = require('vinyl-buffer');
var csscomb          = require('gulp-csscomb');          // делаем сss красивым
var reload           = browserSync.reload;               // перезагрузка сервера
var group            = require('less-plugin-group-css-media-queries');

var path = {
    build: {                                             // Тут мы укажем куда складывать готовые после сборки файлы
        common       : 'build/',
        html         : 'build/',
        js           : 'build/js/',
        css          : 'build/css/',
        img          : 'build/img/',
        fonts        : 'build/fonts/',
        htaccess     : 'build/'
    },
    src: {                                               // Пути откуда брать исходники
        html         : 'src/*.html',
        js           : 'src/js/[^_]*.js',
        jshint       : 'src/js/*.js',
        css          : 'src/less/style.less',
        less         : 'src/less/',
        img          : 'src/img/',
        fonts        : 'src/fonts/**/*.*',
        png2x        : 'src/img/png-sprite/*-2x.png',
        htaccess     : 'src/.htaccess'
    },
    watch: {                                             //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
        html         : 'src/**/*.html',
        js           : 'src/js/**/*.js',
        css          : 'src/less/**/*.*',
        img          : 'src/img/**/*.*',
        fonts        : 'src/fonts/**/*.*',
        htaccess     : 'src/.htaccess',
        pngsprite    : 'src/img/png-sprite/*.*',
        svgsprite    : 'src/img/svg-sprite/*.*'
    },
    clean            : './build/',                       // директории которые могут очищаться
    outputDir        : './build/**/*'                    // исходная корневая директория
};

var onError = function(err) {
    notify.onError({
		title: "Error in " + err.plugin,
    })(err);
    this.emit('end');
};

// ЗАДАЧА: билд html
gulp.task('html:build', function () {
  gulp.src(path.src.html)                             // Выберем файлы по нужному пути
    .pipe( plumber({errorHandler: onError}) )
    .pipe( fileinclude({                              // обрабатываем gulp-file-include
        prefix   : '@@',
        basepath : '@file',
        indent   : true,
    }) )
    .pipe( replace(/\n\s*<!--DEV[\s\S]+?-->/gm, '') ) // убираем комментарии <!--DEV ... -->
    .pipe( size({
        showFiles: true,
        showTotal: false,
        title    : 'HTML'
    }) )
    .pipe( gulp.dest(path.build.html) )               // Выплюнем их в папку build
    .pipe( reload({stream: true}) )                   // И перезагрузим наш сервер для обновлений
});

// ЗАДАЧА: проверка а ошибки js
gulp.task('jshint:build', function() {
  return gulp.src(path.src.jshint)                    // выберем файлы по нужному пути
    .pipe( jshint() )                                 // прогоним через jshint
    .pipe( jshint.reporter('jshint-stylish') )        // стилизуем вывод ошибок в консоль
});

// ЗАДАЧА: билд js
gulp.task('js:build', function () {
  return gulp.src(path.src.js)
    .pipe( plumber({errorHandler: onError}) )
    .pipe( concat('script.min.js') )                  // объеденим все файлы javascript
    .pipe( sourcemaps.init() )                        // инициализируем sourcemap
    .pipe( uglify() )                                 // минифицируем
    .pipe( sourcemaps.write() )                       // пропишем карты
    .pipe( size({
        showFiles: true,
        showTotal: false,
        title    : 'Total JavaScript'
    }) )
    .pipe( gulp.dest(path.build.js) )
    .pipe( reload({stream: true}) )
});

// ЗАДАЧА: билд less
gulp.task('less', function() {
  return gulp.src(path.src.css)                       // какой файл компилировать (путь из константы)
    .pipe( plumber({errorHandler: onError}) )
    .pipe( sourcemaps.init() )                        // инициируем карту кода
    .pipe( less({                                     // компилируем LESS
        plugins: [group]
    }) )
    .on('error', reporter)
    .pipe( autoprefixer({                             // добавляем префиксы
        browsers: ['last 2 versions']
     }) )
    .pipe( csscomb() )                                // причесываем
    .pipe( size({
        showFiles: true,
        showTotal: false,
        title    : 'Common CSS'
    }) )
    .pipe( gulp.dest(path.build.css) )                // записываем CSS-файл (путь из константы)
    .pipe( rename('style.min.css') )                  // переименовываем
    .pipe( cleanCSS() )                               // сжимаем
    .pipe( sourcemaps.write('/') )                    // записываем карту кода как отдельный файл (путь из константы)
    .pipe( size({
        showFiles: true,
        showTotal: false,
        title    : 'Minified CSS'
    }) )
    .pipe( gulp.dest(path.build.css) )                // записываем CSS-файл (путь из константы)
    .pipe( reload({stream: true}) )
});

// ЗАДАЧА: очистка директории /build
gulp.task('clean', function () {
  return gulp.src(path.clean)
    .pipe( clean(path.clean) );
});

// ЗАДАЧА: запуска сервера
gulp.task('server', function () {
  browserSync.init({                                  // запускаем локальный сервер (показ, автообновление, синхронизацию)
    server: {                                         // папка, которая будет «корнем» сервера (путь из константы)
        baseDir    : "./build/"
    },
    port           : 3000,                            // порт, на котором будет работать сервер
    startPath      : '/index.html',                   // файл, который буде открываться в браузере при старте сервера
    // tunnel         : "rapt0p7"                        // наименование сайта для доступа из интернета (вида site-name.localtunnel.me)
    // open           : false                            // возможно, каждый раз стартовать сервер не нужно...
  });
});

// ЗАДАЧА: оптимизция всей графики, запуск вручную
gulp.task('image:opt', function () {
  gulp.src([path.src.img + '*.{gif,png,jpg,jpeg,svg}', // какие файлы обрабатывать (путь из константы, маска имени, много расширений)
      '!' + path.src.img + '/svg-sprite/*.svg',
      '!' + path.src.img + '/png-sprite/*.png'])
    .pipe( plumber({errorHandler: onError}) )
    .pipe( imagemin({                                  // Сожмем их
        progressive      : true,                       // сжатие .jpg
        svgoPlugins      : [{removeViewBox: false}],   // сжатие .svg
        interlaced       : true,                       // сжатие .gif
        optimizationLevel: 3,                          // степень сжатия от 0 до 7
        use              : [imageminPngquant()]
    }))
    .pipe( size({
        showFiles		 : true,
        showTotal		 : false,
        title    		 : 'Images'
    }) )
    .pipe( gulp.dest(path.build.img) )                 // выгрузим в build
    .pipe( reload({stream: true}) );                   // перезагрузим сервер
});

// ЗАДАЧА: копирвание всей графики в директорию /build/img
gulp.task('img', function () {
  return gulp.src([path.src.img + '*.{gif,png,jpg,jpeg,svg}', // какие файлы обрабатывать (путь из константы, маска имени, много расширений)
             '!' + path.src.img + '/svg-sprite/*.svg',
             '!' + path.src.img + '/png-sprite/*.png'])
    .pipe( plumber({errorHandler: onError}) )
    .pipe( newer(path.build.img) )                            // оставить в потоке только новые файлы (сравниваем с содержимым папки билда)
    .pipe( gulp.dest(path.build.img) );                       // записываем файлы (путь из константы)
});

// ЗАДАЧА: сборка png спрайта
gulp.task('png:sprite', function () {
  let fileName = 'sprite-' + Math.random().toString().replace(/[^0-9]/g, '') + '.png';
  // let fileName2x = 'sprite-' + Math.random().toString().replace(/[^0-9]/g, '') + '-2x.png';
  let spriteData = gulp.src([path.src.img + '/png-sprite/*.png'])
    .pipe( plumber({ errorHandler: onError }) )
    .pipe( spritesmith({
        imgName   	: fileName,
        cssName   	: 'sprite.less',
        cssFormat 	: 'less',
        padding		: 4,
        cssTemplate	: 'less.template.mustache',
        imgPath     : '../img/' + fileName
        // retinaSrcFilter: path.src.png2x,
        // retinaImgName: + fileName2x,
        // retinaImgPath: '../img/' + fileName2x,
    }) );
  let imgStream = spriteData.img
        .pipe( buffer() )
        .pipe( imagemin() )
        .pipe( gulp.dest(path.build.img) );
  let cssStream = spriteData.css
        .pipe( gulp.dest(path.src.less) );
  return merge(imgStream, cssStream);
});

// ЗАДАЧА: сборка svg спрайта
gulp.task('svg:sprite', function () {
  return gulp.src(path.src.img + '/svg-sprite/*.svg')
    .pipe( svgmin({
        js2svg: {
            pretty: true
        }
    }))
    .pipe( cheerio({
        run: function ($) {
            $('[fill]').removeAttr('fill');
            $('[stroke]').removeAttr('stroke');
            $('[style]').removeAttr('style');
        },
        parserOptions: {xmlMode: true}
    }))
    .pipe( replace('&gt;', '>') )
    .pipe( svgSprite({
        mode: {
            symbol: {
                sprite: "../sprite.svg",
                    render: {
                        less: {
                            dest:'./../../../src/less/sprite.less',
                            template: "less.svg.template.mustache"
                        }
                    }
                }
            }
    }))
    .pipe( size({
        showFiles: true,
        showTotal: false,
        title    : 'SVG Sprite'
    }) )
    .pipe( gulp.dest(path.build.img) );
});

// ЗАДАЧА: билд шрифтов
gulp.task('fonts:build', function() {
  gulp.src(path.src.fonts)
    .pipe( newer(path.build.fonts) )            // оставить в потоке только изменившиеся файлы
    .pipe( size({
        showFiles: true,
        showTotal: false,
        title    : 'Fonts'
    }) )
    .pipe( gulp.dest(path.build.fonts) )        //выгружаем в build
    .pipe( reload({stream: true}) );
});

// ЗАДАЧА: билд htaccess
gulp.task('htaccess:build', function() {
  gulp.src(path.src.htaccess)
    .pipe( gulp.dest(path.build.htaccess) )    //выгружаем в build
});

// ЗАДАЧА: выгрузка в gh-Pages, запуск вручную
gulp.task('deploy', function() {
  return gulp.src(path.outputDir)
    .pipe( ghpages() );
});

// ЗАДАЧА: билд всего
gulp.task('build', [
    'clean',
    'png:sprite',
    'svg:sprite',
    'html:build',
    'jshint:build',
    'js:build',
    'less',
    'fonts:build',
    'htaccess:build',
    'img'
]);

// ЗАДАЧА: отслеживание изменений
gulp.task('watch', function(){
     //билдим html в случае изменения
    watch([path.watch.html], function(event, cb) {
        gulp.start('html:build');
    });
     //билдим png спрайты в случае изменения
    watch([path.watch.pngsprite], function(event, cb) {
        gulp.start('png:sprite');
    });
    //билдим svg спрайты в случае изменения
    watch([path.watch.svgsprite], function(event, cb) {
        gulp.start('svg:sprite');
    });
     //билдим css в случае изменения
    watch([path.watch.css], function(event, cb) {
        gulp.start('less');
    });
     //проверяем js в случае изменения
    watch([path.watch.js], ['jshint']);
     //билдим js в случае изменения
    watch([path.watch.js], function(event, cb) {
        gulp.start('js:build');
    });
     //копируем изображения в случае изменения
    watch([path.watch.img], function(event, cb) {
        gulp.start('img');
    });
     //билдим шрифты в случае изменения
    watch([path.watch.fonts], function(event, cb) {
        gulp.start('fonts:build');
    });
     //билдим htaccess в случае изменения
    watch([path.watch.htaccess], function(event, cb) {
        gulp.start('htaccess:build');
    });
});

gulp.task('default', ['build', 'watch', 'server']);
