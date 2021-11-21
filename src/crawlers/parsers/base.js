/* eslint class-methods-use-this: 0 */
const clean = require('../../utils/clean');


class BaseParser{
  builderClass = null;
  constructor(feed,config={}){
    this._articles = null;
    this.feed = feed;
    this.errorCount = 0;
    this.totalParsed = 0;
    this.lastError = "";
    this.config=config;
    this._isDead = false;
    this._preFilterArticles = null;
  }
  get articles(){
    if(this._articles!==null){
      return this._articles;
    }
    else{
      throw new Error("Please call parse before accessing articles");
    }
  } 
  get isDead(){
    return this._isDead;
  }
  
  addDefaultFields(article){
    article.feed = this.feed.id || (this.feed._id || "").toString();
    //article.sources=['feed'];
    //articleBody.pageLink= this.feed.link;
    //articleBody.retrieveDate = new Date();
  }
  async parseText(text){
    return {}
  }
  filterDuplicates(articles){
    const seenTitle = {};
    const seenLink ={};
    let cleanTitle;
    return articles.filter((article)=>{
      cleanTitle = clean(article.title);
      if(seenTitle[cleanTitle]) return false;
      seenTitle[cleanTitle] = true;

      if(article.link){
        if(seenLink[article.link]) return false;
        seenLink[article.link] = true;
      }
      return true;
    });
  }
  filterLastCrawled(articles){
    const feed = this.feed;
    const seenTitle = {};
    const seenLink = {};
    let cleanTitle;
    if(feed && feed.lastCache && feed.lastCache.length){
      feed.lastCache.forEach((cache)=>{
        seenTitle[clean(cache.title)] = true;
        seenLink[cache.link] = true;
      });
      return articles.filter((article)=>{
        cleanTitle = clean(article.title);
        if(seenTitle[cleanTitle]){
          return false;
        }
        if(article.link && seenLink[article.link]) return false;
        return true;
      });
    }
    return articles;
  }
  addRetrievedDate(articles){
    //sort by pubDate
    articles.sort((a,b)=>{
      if(a.pubDate && b.pubDate){
        return (a.pubDate.getTime()>b.pubDate.getTime())?-1:1
      }
      if(a.pubDate) return -1;
      if(b.pubDate) return 1;
      return 0;
    });
    const nowTime = new Date().getTime();
    articles.forEach((article,index)=>{
      article.retrieveDate=new Date(nowTime-(index*100));
      console.log(article.pubDate,article.retrieveDate);
    })
  }
  _filter(articles){
    //remove articles published more than n days ago
    const daysDiff=[];
    const skipAfterDays = this.feed.skipAfterDays || this.config.skipAfterDays || 5;
    let filtered = articles;
    filtered = this.filterLastCrawled(filtered);
    filtered = filtered.filter(article=>{
      if(article.pubDate && ((new Date()).getTime() - article.pubDate.getTime())>(this.config.skipAfterDays || 5)*24*60*60*1000){
        const dayDiff = (new Date().getTime()-article.pubDate.getTime())/(24*60*60*1000);
        daysDiff.push(daysDiff);
        if(daysDiff > skipAfterDays){
          return false;
        }
      }
      return true;
    },this);
    if(filtered.length && Math.min(daysDiff)>(this.config.deadAfterDays || 30)){
      this._isDead = true;
      this._articles = []
      return [];
    }
    console.log("Before duplicate removal",filtered.length);
    filtered = this.filterDuplicates(filtered);
    console.log("After duplicate removal",filtered.length);
    filtered = filtered.filter(article=>{
      return this.checkValid(article);
    },this);
    console.log("After valid check",filtered.length);
    return filtered;

  }
  checkValid(article){
    const feed = this.feed;
    let valid = true;
    let key,reg;
    if(feed.filterRules && feed.filterRules.length){
      feed.filterRules.forEach((rule)=>{
        key = rule.substr(0,rule.indexOf(':'));
        reg = rule.substr(rule.indexOf(':')+1);
        if(key && reg){
          if(new RegExp(reg,'i').test(article[key])){
            valid = false;
          } 
        }
      });
    }
    return valid;
  }
  async parse(text){
    const rawArticles = await this.parseText(text);
    const articles = rawArticles.map(rawArticle=>{
      this.totalParsed += 1
      const builder = new this.builderClass(rawArticle,this.feed,{});
      try{
        builder.construct();
        const article = builder.article;
        this.addDefaultFields(article);
        return article;
      }catch(err){
        this.errorCount+=1;
        this.lastError = `${err}`;
        return false;
      }
    },this).filter(x=> !!x);
    this._preFilterArticles = articles;
    const filteredArticles = this._filter(articles);
    this.addRetrievedDate(filteredArticles);
    this._articles = filteredArticles;
    return filteredArticles;
  }
  async getArticlesCache(){
    if(this._preFilterArticles){
      const articles = this._preFilterArticles;
      return articles.map((article)=>{
        return {
          link: article.link || "",
          title: clean(article.title || ""),
        }
      });
    }
    return [];
  }
}
module.exports = BaseParser;

