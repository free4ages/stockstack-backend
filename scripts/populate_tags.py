import requests
from nsetools import Nse
nse = Nse()
headers = {
            'content-type':'application/json',
            'Authorization':'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MTY2ZjNlMWZlNjc5OTBjYTU5N2JjYzciLCJpYXQiOjE2MzQ4MzY3NjksImV4cCI6MTY2NjM3Mjc2OSwidHlwZSI6ImFjY2VzcyJ9.Rcuo22dIgy5e8XOkSuA0f1Ake80WHo2GwKuigd80EdY'
        }
def populate_stock(symbol,company):
    if(symbol.lower()=="symbol"):
        return
    data = {
        'name':symbol,
        'aliases':[symbol,company],
        'approved':True,
        'isEquity':True,
        'displayName':symbol,
    }
    res = requests.post('http://localhost:3000/v1/tags',json=data,headers=headers);
    if(res.status_code!=201):
        print(f"An Error occured while creating {symbol}")

def populate_nse_stocks():
    all_stock_codes = nse.get_stock_codes()
    for symbol,company in all_stock_codes.items():
        populate_stock(symbol,company)

if __name__=="__main__":
    populate_nse_stocks()


