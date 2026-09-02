package com.crmsuper.pos.controller;

import com.crmsuper.pos.dto.DashboardSummaryResponse;
import com.crmsuper.pos.dto.ProfitRow;
import com.crmsuper.pos.dto.SalesByCashierRow;
import com.crmsuper.pos.dto.SalesByCategoryRow;
import com.crmsuper.pos.dto.SalesByDayRow;
import com.crmsuper.pos.dto.SalesByProductRow;
import com.crmsuper.pos.service.ReportService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Reportes y dashboard; solo administrador/supervisor (ver SecurityConfig). */
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/summary")
    public DashboardSummaryResponse summary() {
        return reportService.summary();
    }

    @GetMapping("/sales-by-day")
    public List<SalesByDayRow> salesByDay(@RequestParam(required = false) String from, @RequestParam(required = false) String to) {
        return reportService.salesByDay(from, to);
    }

    @GetMapping("/sales-by-product")
    public List<SalesByProductRow> salesByProduct(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Integer limit
    ) {
        return reportService.salesByProduct(from, to, limit);
    }

    @GetMapping("/sales-by-category")
    public List<SalesByCategoryRow> salesByCategory(@RequestParam(required = false) String from, @RequestParam(required = false) String to) {
        return reportService.salesByCategory(from, to);
    }

    @GetMapping("/sales-by-cashier")
    public List<SalesByCashierRow> salesByCashier(@RequestParam(required = false) String from, @RequestParam(required = false) String to) {
        return reportService.salesByCashier(from, to);
    }

    @GetMapping("/profit")
    public List<ProfitRow> profit(@RequestParam(required = false) String from, @RequestParam(required = false) String to) {
        return reportService.profit(from, to);
    }
}
