'use strict';
function sn(a, b, c) {
    return vd(Md(a - b, -180, 180)) <= c
}
function tn(a, b, c, d, e) {
    if (!d) {
        d = a.lng();
        c = vd(Md(c - d, -180, 180));
        d = a.lng();
        var f = b.lng();
        d = vd(Md(f - d, -180, 180));
        c = c / d;
        if (!e)
            return e = l.sin(Od(a.lat())), e = l.log((1 + e) / (1 - e)) / 2, b = l.sin(Od(b.lat())), b = l.log((1 + b) / (1 - b)) / 2, Pd(2 * l[Xb](l.exp(e + c * (b - e))) - l.PI / 2);
        a = e[ib](a);
        b = e[ib](b);
        return e[Fb](new O(a.x + c * (b.x - a.x), a.y + c * (b.y - a.y))).lat()
    }
    e = Od(a.lat());
    a = Od(a.lng());
    d = Od(b.lat());
    b = Od(b.lng());
    c = Od(c);
    return Md(Pd(l[xc](l.sin(e) * l.cos(d) * l.sin(c - b) - l.sin(d) * l.cos(e) * l.sin(c - a), l.cos(e) * l.cos(d) * l.sin(a - b))), -90, 90)
}
var un = {containsLocation: function(a, b) {
        for (var c = Md(a.lng(), -180, 180), d = !!b.get("geodesic"), e = b.get("latLngs"), f = b.get("map"), f = !d && f ? f[tc]() : null, g = !1, h = 0, n = e[Tb](); h < n; ++h)
            for (var r = e[Jc](h), s = 0, u = r[Tb](); s < u; ++s) {
                var x = r[Jc](s), D = r[Jc]((s + 1) % u), I = Md(x.lng(), -180, 180), G = Md(D.lng(), -180, 180), K = yd(I, G), I = zd(I, G);
                (180 < K - I ? c >= K || c < I : c < K && c >= I) && tn(x, D, c, d, f) < a.lat() && (g = !g)
            }
        return g || un.isLocationOnEdge(a, b)
    }, isLocationOnEdge: function(a, b, c) {
        c = c || 1E-9;
        var d = Md(a.lng(), -180, 180), e = b instanceof am, f = !!b.get("geodesic"), g = b.get("latLngs");
        b = b.get("map");
        b = !f && b ? b[tc]() : null;
        for (var h = 0, n = g[Tb](); h < n; ++h)
            for (var r = g[Jc](h), s = r[Tb](), u = e ? s : s - 1, x = 0; x < u; ++x) {
                var D = r[Jc](x), I = r[Jc]((x + 1) % s), G = Md(D.lng(), -180, 180), K = Md(I.lng(), -180, 180), S = yd(G, K), $ = zd(G, K), R;
                if (R = sn(G, K, 1E-9)) {
                    if (G = sn(G, d, c) || sn(K, d, c))
                        G = a.lat(), K = zd(D.lat(), I.lat()) - c, R = yd(D.lat(), I.lat()) + c, G = G >= K && G <= R;
                    R = G
                }
                if (R)
                    return!0;
                if (180 < S - $ ? d + c >= S || d - c <= $ : d + c >= $ && d - c <= S)
                    if (D = tn(D, I, d, f, b), vd(D - a.lat()) < c)
                        return!0
            }
        return!1
    }};
var vn = {
    computeHeading: function(a, b) {
        var c = se(a), d = se(b), e = te(b) - te(a);
        return Md(Pd(l[xc](l.sin(e) * l.cos(d), l.cos(c) * l.sin(d) - l.sin(c) * l.cos(d) * l.cos(e))), -180, 180)
    }, computeOffset: function(a, b, c, d) {
        b /= d || 6378137;
        c = Od(c);
        var e = se(a);
        d = l.cos(b);
        b = l.sin(b);
        var f = l.sin(e), e = l.cos(e), g = d * f + b * e * l.cos(c);
        return new Q(Pd(l[hc](g)), Pd(te(a) + l[xc](b * e * l.sin(c), d - f * g)));
    }, computeOffsetOrigin: function(a, b, c, d) {
        c = Od(c);
        b /= d || 6378137;
        d = l.cos(b);
        var e = l.sin(b) * l.cos(c);
        b = l.sin(b) * l.sin(c);
        c = l.sin(se(a));
        var f = e * e * d * d + d * d * d * d - d * d * c * c;
        if (0 > f)
            return null;
        var g = e * c + l[yc](f), g = g / (d * d + e * e), h = (c - e * g) / d, g = l[xc](h, g);
        if (g < -l.PI / 2 || g > l.PI / 2)
            g = e * c - l[yc](f), g = l[xc](h, g / (d * d + e * e));
        return g < -l.PI / 2 || g > l.PI / 2 ? null : new Q(Pd(g), Pd(te(a) - l[xc](b, d * l.cos(g) - e * l.sin(g))));
    }, interpolate: function(a, b, c) {
        var d = se(a), e = te(a), f = se(b), g = te(b), h = l.cos(d), n = l.cos(f);
        b = vn.Sf(a, b);
        var r = l.sin(b);
        if (1E-6 > r)
            return new Q(a.lat(), a.lng());
        a = l.sin((1 - c) * b) / r;
        c = l.sin(c * b) / r;
        b = a * h * l.cos(e) + c * n * l.cos(g);
        e = a * h * l.sin(e) + c * n * l.sin(g);
        return new Q(Pd(l[xc](a * l.sin(d) + c * l.sin(f), l[yc](b * b + e * e))), Pd(l[xc](e, b)))
    }, Sf: function(a, b) {
        var c = se(a), d = se(b);
        return 2 * l[hc](l[yc](l.pow(l.sin((c - d) / 2), 2) + l.cos(c) * l.cos(d) * l.pow(l.sin((te(a) - te(b)) / 2), 2)))
    }, computeDistanceBetween: function(a, b, c) {
        return vn.Sf(a, b) * (c || 6378137)
    }, computeLength: function(a, b) {
        var c = b || 6378137, d = 0;
        a instanceof jg && (a = a[$b]());
        for (var e = 0, f = a[E] - 1; e < f; ++e)
            d += vn.computeDistanceBetween(a[e], a[e + 1], c);
        return d
    }, computeArea: function(a, b) {
        return l.abs(vn.computeSignedArea(a, b))
    }, computeSignedArea: function(a, b) {
        var c = b || 6378137;
        a instanceof jg && (a = a[$b]());
        for (var d = a[0], e = 0, f = 1, g = a[E] - 1; f < g; ++f)
            e += vn.Wm(d, a[f], a[f + 1]);
        return e * c * c
    }, Wm: function(a, b, c) {
        return vn.Om(a, b, c) * vn.Pm(a, b, c)
    }, Om: function(a, b, c) {
        var d = [a, b, c, a];
        a = [];
        for (c = b = 0; 3 > c; ++c)
            a[c] = vn.Sf(d[c], d[c + 1]), b += a[c];
        b /= 2;
        d = l.tan(b / 2);
        for (c = 0; 3 > c; ++c)
            d *= l.tan((b - a[c]) / 2);
        return 4 * l[Xb](l[yc](l.abs(d)))
    }, Pm: function(a, b, c) {
        a = [a, b, c];
        b = [];
        for (c = 0; 3 > c; ++c) {
            var d = a[c], e = se(d), d = te(d), f = b[c] = [];
            f[0] = l.cos(e) * l.cos(d);
            f[1] = l.cos(e) * l.sin(d);
            f[2] = l.sin(e)
        }
        return 0 < b[0][0] * b[1][1] * b[2][2] + b[1][0] * b[2][1] * b[0][2] + b[2][0] * b[0][1] * b[1][2] - b[0][0] * b[2][1] * b[1][2] - b[1][0] * b[0][1] * b[2][2] - b[2][0] * b[1][1] * b[0][2] ? 1 : -1
    }};
var wn = {decodePath: function(a) {
        for (var b = J(a), c = ea(l[lb](a[E] / 2)), d = 0, e = 0, f = 0, g = 0; d < b; ++g) {
            var h = 1, n = 0, r;
            do
                r = a[Rc](d++) - 63 - 1, h += r << n, n += 5;
            while (31 <= r);
            e += h & 1 ? ~(h >> 1) : h >> 1;
            h = 1;
            n = 0;
            do
                r = a[Rc](d++) - 63 - 1, h += r << n, n += 5;
            while (31 <= r);
            f += h & 1 ? ~(h >> 1) : h >> 1;
            c[g] = new Q(1E-5 * e, 1E-5 * f, !0)
        }
        Za(c, g);
        return c
    }, encodePath: function(a) {
        a instanceof jg && (a = a[$b]());
        return wn.Zm(a, function(a) {
            return[Ad(1E5 * a.lat()), Ad(1E5 * a.lng())]
        })
    }, Zm: function(a, b) {
        for (var c = [], d = [0, 0], e, f = 0, g = J(a); f < g; ++f)
            e = b ? b(a[f]) : a[f], wn.Zh(e[0] - d[0], c), wn.Zh(e[1] - d[1], c), d = e;
        return c[Wc]("")
    }, xn: function(a) {
        for (var b = J(a), c = ea(b), d = 0; d < b; ++d)
            c[d] = a[Rc](d) - 63;
        return c
    }, Zh: function(a, b) {
        return wn.$m(0 > a ? ~(a << 1) : a << 1, b)
    }, $m: function(a, b) {
        for (; 32 <= a; )
            b[A](String[uc]((32 | a & 31) + 63)), a >>= 5;
        b[A](String[uc](a + 63));
        return b
    }};

/*
ud.google.maps[wf] = {encoding: wn, spherical: vn, poly: un};
function xn() {
}
H = xn();
H.decodePath = wn.decodePath;
H.encodePath = wn.encodePath;
H.computeDistanceBetween = vn.computeDistanceBetween;
H.interpolate = vn.interpolate;
H.computeHeading = vn[qc];
H.computeOffset = vn.computeOffset;
H.computeOffsetOrigin = vn.computeOffsetOrigin;
ag(wf, new xn);
*/