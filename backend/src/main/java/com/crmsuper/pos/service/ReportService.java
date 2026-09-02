package com.crmsuper.pos.service;

import com.crmsuper.pos.dto.DashboardSummaryResponse;
import com.crmsuper.pos.dto.ProfitRow;
import com.crmsuper.pos.dto.SalesByCashierRow;
import com.crmsuper.pos.dto.SalesByCategoryRow;
import com.crmsuper.pos.dto.SalesByDayRow;
import com.crmsuper.pos.dto.SalesByProductRow;

import java.util.List;

public interface ReportService {
    DashboardSummaryResponse summary();
    List<SalesByDayRow> salesByDay(String from, String to);
    List<SalesByProductRow> salesByProduct(String from, String to, Integer limit);
    List<SalesByCategoryRow> salesByCategory(String from, String to);
    List<SalesByCashierRow> salesByCashier(String from, String to);
    List<ProfitRow> profit(String from, String to);
}
