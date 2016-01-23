/**
 * User: Steven
 * Email:21xsj@163.com
 * Date: 14-10-07
 * Description:
 */
;(function ($, window, document, undefined) {
    var MultipleDatePicker = function (element, options) {
        this.element = $(element);
        this.formater = PickerUtil.parseFormat(options.format || 'yyyy-mm-dd');
        this.container = null;
        this.options = options;
        this.selected_result = [];
        this.start_date = null;
        this.end_date = null;
        this.show_date = [];
        this.range_info = {
            book_ranges: null,
            unavail_ranges: null
        };
        this.setRangeInfo();
        this.buildContainer();
        var that = this;
        $(window).resize(function () {
            var col_count = that.getRealColCount();
            if (col_count === $('.m-db-row:first-child .m-db-col', that.container).length) {
                return;
            }
            var d = that.show_date[0]['show_days'][21]['month_obj'];
            that.renderDateBoxes(d);
            that.highlightSelectedDays();
        });
    };
    MultipleDatePicker.prototype = {
        constructor: MultipleDatePicker,
        getSelectedDates: function () {
            var that = this;
            var strArray = [];
            if (that.selected_result.length === 2) {
                strArray[0] = PickerUtil.formatDate(that.start_date, that.formater);
                strArray[1] = PickerUtil.formatDate(that.end_date, that.formater);
            } else if (that.selected_result.length === 1) {
                strArray[0] = PickerUtil.formatDate(that.start_date, that.formater);
            }
            return strArray;
        },
        clearSelect: function () {
            this.start_date = null;
            this.end_date = null;
            this.selected_result = [];
            this.highlightSelectedDays();
        },
        getRealColCount: function () {
            var count = this.options.col_count;
            var w = $(window).width();
            if (w >= 480 && w < 660) {
                count = 2;
            } else if (w < 480) {
                count = 1;
            }
            return count;
        },
        setRangeInfo: function () {
            var o = this.options;
            var that = this;
            try {
                that.range_info.book_ranges = str2Date(o.book_ranges);
                that.range_info.unavail_ranges = str2Date(o.unavail_ranges);
            }
            catch (e) {
            }
            function str2Date(rangesArray) {
                if (rangesArray && rangesArray.length > 0) {
                    var dateRange1 = [];
                    $.each(rangesArray, function (i, ranges) {
                            if (ranges && ranges.length == 2) {
                                dateRange1.push([PickerUtil.parseDate(ranges[0], that.formater), PickerUtil.parseDate(ranges[1], that.formater)]);
                            }
                        }
                    );
                    return dateRange1;
                }
                return null;
            }
        },
        buildContainer: function () {
            var that = this;
            var opt = that.options;
            var container = $(PickerUtil.container_tpl);
            container.find('.m-db-boxes').html('');
            that.container = container.appendTo(that.element);
            that.renderDateBoxes(new Date());
            $('.global-nav .pre', that.container).click(function () {
                var count = opt.row_count * that.getRealColCount();
                var d = that.show_date[count - 1]['show_days'][21]['month_obj'];
                d.setMonth(d.getMonth() - count * 2 + 1);
                that.renderDateBoxes(d);
                that.highlightSelectedDays();
            });
            $('.global-nav .next', that.container).click(function () {
                var d = that.show_date[0]['show_days'][21]['month_obj'];
                d.setMonth(d.getMonth() + opt.row_count * that.getRealColCount());
                that.renderDateBoxes(d);
                that.highlightSelectedDays();
            });
        },
        renderDateBoxes: function (start_date) {
            var that = this;
            var opt = that.options;
            var boxes = that.container.find('.m-db-boxes');
            boxes.html('');
            that.show_date = [];
            var colX = that.getRealColCount();
            var months = PickerUtil.getMonthList(start_date, opt.row_count * colX);
            for (var i = 0; i < opt.row_count; i++) {
                var row = $('<div class="m-db-row m-db-clearfix"></div>').appendTo(boxes);
                for (var j = 0; j < colX; j++) {
                    var seq = (i * colX + j);
                    if (j === colX - 1) {
                        row.append($('<div class="m-db-col last-db-col" mdp-col-index="' + seq + '"></div>').append(that.buildDateBox(months[seq], seq)['dom_obj']));
                    } else {
                        row.append($('<div class="m-db-col" mdp-col-index="' + seq + '"></div>').append(that.buildDateBox(months[seq], seq)['dom_obj']));
                    }
                }
            }
            that.handlePreNav();
        },
        getDateMatrix: function (date) {
            var start_d = new Date(date.getFullYear(), date.getMonth(), 1);
            var week_day = start_d.getDay();
            var preMon = new Date(date.getFullYear(), date.getMonth() - 1, 1);
            var nextMon = new Date(date.getFullYear(), date.getMonth() + 1, 1);
            var show_days = [];
            for (var i = week_day - 1; i >= 0; i--) {
                show_days.push({
                    is_current_month: false,
                    is_current_day: false,
                    month_obj: preMon,
                    day_num: PickerUtil.getDaysInMonth(preMon.getFullYear(), preMon.getMonth()) - i
                });
            }
            for (var v = 1; v <= PickerUtil.getDaysInMonth(date.getFullYear(), date.getMonth()); v++) {
                show_days.push({
                    is_current_month: true,
                    is_current_day: date.getDate() == v,
                    month_obj: date,
                    day_num: v
                });
            }
            var m = show_days.length;
            var index = 1;
            for (; m < 42; m++) {
                show_days.push({
                    is_current_month: false,
                    is_current_day: false,
                    month_obj: nextMon,
                    day_num: index++
                });
            }
            return show_days;
        },
        buildDateBox: function (d, itemIndex) {
            var that = this;
            var result = {};
            result['current_date'] = d;
            var show_days = that.getDateMatrix(d);
            var item = $(PickerUtil.getBoxItemTpl(that.options.locale));
            item.find('.navigation').text(PickerUtil.formatMonth(that.options.locale, d));
            for (var j = 0; j < 6; j++) {
                var day_row = $(PickerUtil.day_row_tpl);
                for (var n = 0; n < 7; n++) {
                    var tdObj = day_row.find('td').eq(n);
                    var data = show_days[(j * 7 + n)];
                    if (!data.is_current_month) {
                        tdObj.addClass('not-current-months');
                        tdObj.html('<div class="not-current"><span>&nbsp;</span></div>');
                        continue;
                    }
                    tdObj.attr('mdp-index', (j * 7 + n));
                    var date = new Date(data['month_obj'].getFullYear(), data['month_obj'].getMonth(), data.day_num);
                    var dayNum = data.day_num;
                    tdObj.html('<div class="' + getDayStyle(date) + '"><span>' + dayNum + '</span></div>');
                    if (that.selected_result) {
                        var slted_list = that.selected_result;
                        for (var k = 0; k < slted_list.length; k++) {
                            var i_d = slted_list[k];
                            if (i_d && i_d.getMonth() == data['month_obj'].getMonth() && i_d.getFullYear() == data['month_obj'].getFullYear() &&
                                i_d.getDate() == data['day_num']) {
                                tdObj.find('div').addClass('selected');
                            }
                        }
                    }
                }
                item.find('tbody').append(day_row);
            }
            result['show_days'] = show_days;
            result['dom_obj'] = item;
            bindDayClick();
            that.show_date[itemIndex] = result;
            return result;
            function bindDayClick() {
                $('.avail', item).on('click', function () {
                    var date_obj = show_days[$(this).closest('td').attr('mdp-index')]['month_obj'];
                    date_obj.setDate(show_days[$(this).closest('td').attr('mdp-index')]['day_num']);
                    if (that.selected_result.length === 2) {
                        if (PickerUtil.isSameDay(that.start_date, that.end_date) &&
                            PickerUtil.isSameDay(that.start_date, date_obj)) {
                            that.start_date = null;
                            that.end_date = null;
                            that.selected_result = [];
                            that.highlightSelectedDays();
                            return;
                        }
                        if (that.start_date.getTime() > date_obj.getTime()) {
                            if (!isValid(new Date(date_obj), that.end_date)) {
                                return;
                            }
                            that.start_date = new Date(date_obj);
                        } else {
                            if (!isValid(that.start_date, new Date(date_obj))) {
                                return;
                            }
                            that.end_date = new Date(date_obj);
                        }
                        that.selected_result = [that.start_date, that.end_date];
                        that.highlightSelectedDays();
                    } else if (that.selected_result.length === 1) {
                        if (!isValid(that.start_date, new Date(date_obj)) || !isValid(new Date(date_obj), that.start_date)) {
                            return;
                        }
                        if (PickerUtil.isSameDay(that.start_date, date_obj)) {
                            that.start_date = null;
                            that.selected_result = [];
                            that.highlightSelectedDays();
                            return;
                        }
                        if (that.selected_result[0].getTime() > date_obj.getTime()) {
                            that.start_date = new Date(date_obj);
                            that.end_date = that.selected_result[0]
                        } else {
                            that.end_date = new Date(date_obj)
                        }
                        that.selected_result = [that.start_date, that.end_date];
                        that.highlightSelectedDays();
                    } else {
                        that.start_date = new Date(date_obj);
                        that.selected_result = [that.start_date];
                        that.highlightSelectedDays();
                    }
                });
            }

            function getDayStyle(date) {
                date.setHours(0);
                date.setMinutes(0);
                date.setSeconds(0);
                date.setMilliseconds(0);
                var class_name = '';
                var t = date.getTime();
                var now = new Date();
                now.setHours(0);
                now.setSeconds(0);
                now.setMinutes(0);
                now.setMilliseconds(0);
                if (t < now.getTime()) {
                    class_name = 'not-avail';
                    return class_name;
                }
                var bRanges = that.range_info.book_ranges;
                var item = null;
                if (bRanges) {
                    for (var i = 0; i < bRanges.length; i++) {
                        item = bRanges[i];
                        var bs = item[0];
                        var be = item[1];
                        if (t >= bs.getTime() && t <= be.getTime()) {
                            return 'booked';
                        }
                    }
                }
                var unavailRanges = that.range_info.unavail_ranges;
                if (unavailRanges) {
                    for (var i = 0; i < unavailRanges.length; i++) {
                        item = unavailRanges[i];
                        var us = item[0];
                        var ue = item[1];
                        if (t >= us.getTime() && t <= ue.getTime()) {
                            return 'not-avail';
                        }
                    }
                }
                return 'avail';
            }

            function isValid(s_d, e_d) {
                if (!that.range_info.book_ranges) {
                    return true;
                }
                var flag = true;
                if (that.range_info.book_ranges) {
                    flag = isValidInRanges(s_d, e_d, that.range_info.book_ranges);
                }
                if (flag) {
                    if (that.range_info.unavail_ranges) {
                        flag = isValidInRanges(s_d, e_d, that.range_info.unavail_ranges);
                    }
                }
                return flag;
                function isValidInRanges(sDate, eDate, ranges) {
                    var t = new Date(sDate);
                    var flag = true;
                    while (t.getTime() < eDate.getTime()) {
                        var innerFlag = true;
                        for (var i = 0; i < ranges.length; i++) {
                            var rangeItem = ranges[i];
                            if (t.getTime() > rangeItem[0].getTime() && t.getTime() < rangeItem[1].getTime()) {
                                innerFlag = false;
                                break;
                            }
                        }
                        if (!innerFlag) {
                            flag = false;
                            break;
                        }
                        t.setDate(t.getDate() + 1);
                    }
                    return flag;
                }
            }
        },
        highlightSelectedDays: function () {
            var that = this;
            $('.days td div', that.container).each(function (i, o) {
                $(o).removeClass('selected');
            });
            if (!that.start_date && !that.end_date) {
                return;
            }
            $('.m-db-col', that.container).each(function (i, o) {
                o = $(o);
                var col_index = +o.attr('mdp-col-index');
                var d_o = that.show_date[col_index]['show_days'];
                var tds = o.find('td');
                tds.each(function (i1, o1) {
                    o1 = $(o1);
                    var dp_index = o1.attr('mdp-index');
                    if (dp_index != null) {
                        var date = new Date(d_o[dp_index]['month_obj']);
                        date.setDate(d_o[dp_index]['day_num']);
                        if (that.end_date) {
                            if (PickerUtil.isSameDay(date, that.start_date)) {
                                o1.find('div').addClass('selected');
                            } else if (PickerUtil.isSameDay(date, that.end_date)) {
                                o1.find('div').addClass('selected');
                            } else if (date.getTime() > that.start_date.getTime() && date.getTime() < that.end_date.getTime()) {
                                o1.find('div').addClass('selected');
                            }
                        } else {
                            if (PickerUtil.isSameDay(date, that.start_date)) {
                                var clazz = o1.find('div').attr('class');
                                if (clazz.indexOf('-begin') > -1) {
                                    o1.find('div').addClass('selected');
                                } else {
                                    o1.find('div').addClass('selected');
                                }
                            }
                        }
                    }
                });
            });
        },
        handlePreNav: function () {
            var that = this;
            if (that.show_date.length > 0) {
                var now = new Date();
                var days = that.show_date[0]['show_days'];
                for (var i = 0; i < days.length; i++) {
                    var day = days[i];
                    var date = day['month_obj'];
                    if (day['is_current_month']) {
                        if (now.getFullYear() === date.getFullYear() && now.getMonth() === date.getMonth()) {
                            $('.global-nav .pre', that.container).hide();
                        } else {
                            $('.global-nav .pre', that.container).show();
                        }
                        break;
                    }
                }
            }
        }
    };
    var PickerUtil = {
        isSameDay: function (date1, date2) {
            return (date1.getFullYear() === date2.getFullYear() &&
                date1.getMonth() === date2.getMonth() &&
                date1.getDate() === date2.getDate())
        },
        formatMonth: function (locale, date) {
            try {
                return regions[locale].months[date.getMonth()] + ' ' + date.getFullYear();
            } catch (e) {
                return regions['en'].months[date.getMonth()] + ' ' + date.getFullYear();
            }
        },
        getMonthList: function (date, count) {
            var step = 1;
            var result = [];
            result.push(date);
            for (var i = 0; i < count - 1; i++) {
                var new_m = new Date(date.getFullYear(), date.getMonth(), 1);
                new_m.setMonth(new_m.getMonth() + (i + 1) * step);
                result.push(new_m);
            }
            return result;
        },
        getDaysInMonth: function (year, month) {
            function isLeapYear(year) {
                return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0))
            }

            return [31, (isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
        },
        parseDate: function (dateStr, formater) {
            var parts = dateStr.split(formater.separator),
                date = new Date(),
                val;
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            date.setMilliseconds(0);
            if (parts.length === formater.parts.length) {
                var year = date.getFullYear(), day = date.getDate(), month = date.getMonth();
                for (var i = 0, cnt = formater.parts.length; i < cnt; i++) {
                    val = parseInt(parts[i], 10) || 1;
                    switch (formater.parts[i]) {
                        case 'dd':
                        case 'd':
                            day = val;
                            date.setDate(val);
                            break;
                        case 'mm':
                        case 'm':
                            month = val - 1;
                            date.setMonth(val - 1);
                            break;
                        case 'yy':
                            year = 2000 + val;
                            date.setFullYear(2000 + val);
                            break;
                        case 'yyyy':
                            year = val;
                            date.setFullYear(val);
                            break;
                    }
                }
                date = new Date(year, month, day, 0, 0, 0);
            }
            return date;
        },
        parseFormat: function (format) {
            var separator = format.match(/[.\/\-\s].*?/),
                parts = format.split(/\W+/);
            if (!separator || !parts || parts.length === 0) {
                throw new Error("Invalid date format.");
            }
            return {separator: separator, parts: parts};
        },
        formatDate: function (date, formater) {
            var val = {
                d: date.getDate(),
                m: date.getMonth() + 1,
                yy: date.getFullYear().toString().substring(2),
                yyyy: date.getFullYear()
            };
            val.dd = (val.d < 10 ? '0' : '') + val.d;
            val.mm = (val.m < 10 ? '0' : '') + val.m;
            var array = [];
            for (var i = 0, cnt = formater.parts.length; i < cnt; i++) {
                array.push(val[formater.parts[i]]);
            }
            return array.join(formater.separator);
        },
        day_row_tpl: [
            '<tr class="days">',
            '	<td></td>',
            '	<td></td>',
            '	<td></td>',
            '	<td></td>',
            '	<td></td>',
            '	<td></td>',
            '	<td></td>',
            '</tr>'
        ].join(''),
        getBoxItemTpl: function (locale) {
            var r = regions[locale];
            if (!r) {
                console.warn('can not find locale=%s configuration', locale);
                r = regions['en'];
            }
            return [
                '<table class="date-box">',
                '    <caption class="navigation"></caption>',
                '    <tbody>',
                '    <tr class="week-tips">',
                '        <td>' + r['weeks'][0] + '</td>',
                '        <td>' + r['weeks'][1] + '</td>',
                '        <td>' + r['weeks'][2] + '</td>',
                '        <td>' + r['weeks'][3] + '</td>',
                '        <td>' + r['weeks'][4] + '</td>',
                '        <td>' + r['weeks'][5] + '</td>',
                '        <td>' + r['weeks'][6] + '</td>',
                '    </tr>',
                '    </tbody>',
                '</table>'
            ].join('');
        },
        container_tpl: [
            '<div class="m-dp-container">',
            '    <div class="global-nav m-db-clearfix ">',
            '        <span class="pull-l"><i class="pre">&lt;</i></span>',
            '        <span class="pull-r"><i class="next">&gt;</i></span>',
            '    </div>',
            '    <div class="m-db-boxes">',
            '    </div>',
            '</div>'
        ].join('')

    };
    var regions = {
        'en': {
            months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            weeks: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        },
        'zh': {
            months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
            weeks: ['日', '一', '二', '三', '四', '五', '六']
        },
        'es': {
            months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
            weeks: ['D', 'L', 'M', 'X', 'J', 'V', 'S']
        }
    };
    $.fn.multiple_datepicker = function (options) {
        var action = null;
        if (typeof options === 'object') {
            options = $.extend({}, $.fn.multiple_datepicker.config, options);
        } else {
            action = options;
        }
        var ret = this;
        this.each(function () {
            var obj = null;
            if (action == 'getSelect') {
                ret = $(this).data('multiple_datepicker').getSelectedDates();
            } else if (action == 'clearSelect') {
                $(this).data('multiple_datepicker').clearSelect();
            } else {
                obj = new MultipleDatePicker(this, options);
                $(this).data('multiple_datepicker', obj);
            }

        });
        return ret;
    };

    $.fn.multiple_datepicker.config = {
        locale: 'en',
        row_count: 1,
        col_count: 3,
        format: 'yyyy-mm-dd',
        book_ranges: null,
        unavail_ranges: null
    };
})(jQuery, window, document);