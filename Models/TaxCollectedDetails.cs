using System.Text.Json.Serialization;

public class TaxCollectedDetails
{
    public int ID { get; set; }
    
    [JsonPropertyName("company_Code")]
    public string Company_Code { get; set; }
    
    [JsonPropertyName("legal_Entity_Name")]
    public string Legal_Entity_Name { get; set; }
    
    [JsonPropertyName("tax_Reporting_Country")]
    public string Tax_Reporting_Country { get; set; }
    
    [JsonPropertyName("hfm_Code")]
    public string HFM_Code { get; set; }
    
    [JsonPropertyName("fiscal_Period")]
    public string Fiscal_Period { get; set; }
    
    public DateTime Date { get; set; }
    public int User_ID { get; set; }
    
    [JsonPropertyName("state_Province")]
    public string State_Province { get; set; }
    
    [JsonPropertyName("erp")]
    public string ERP { get; set; }
    
    [JsonPropertyName("comments")]
    public string Comments { get; set; }
    
    public DateTime Created { get; set; }
    public string Created_By { get; set; }
    public DateTime Modified { get; set; }
    public string Modified_By { get; set; }
    
    [JsonPropertyName("currency")]
    public string Currency { get; set; }
    
    public bool Updatecheck { get; set; }
    
    [JsonPropertyName("net_VAT_Receivable")]
    public decimal? Net_VAT_Receivable { get; set; }
    
    [JsonPropertyName("net_VAT_Payable")]
    public decimal? Net_VAT_Payable { get; set; }

    public User? User { get; set; }
}