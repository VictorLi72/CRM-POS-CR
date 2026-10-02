package com.crmsuper.pos.service;

import com.crmsuper.pos.dto.reporte.DashboardSummaryResponse;
import com.crmsuper.pos.dto.reporte.ProfitRow;
import com.crmsuper.pos.dto.reporte.SalesByCashierRow;
import com.crmsuper.pos.dto.reporte.SalesByCategoryRow;
import com.crmsuper.pos.dto.reporte.SalesByDayRow;
import com.crmsuper.pos.dto.reporte.SalesByProductRow;

import java.util.List;

public interface ReportService {
    DashboardSummaryResponse summary();
    List<SalesByDayRow> salesByDay(String from, String to);
    List<SalesByProductRow> salesByProduct(String from, String to, Integer limit);
    List<SalesByCategoryRow> salesByCategory(String from, String to);
    List<SalesByCashierRow> salesByCashier(String from, String to);
    List<ProfitRow> profit(String from, String to);
}
