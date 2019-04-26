import * as React from 'react';

import {STATES, WEIGHTS} from '../constants';
import {appendQuotes} from '../actions';
import db from '../db';

class Publication extends React.Component
  <any, any>
  {
    public static defaultProps = {
        tags: [],
        notes: []
    };

    constructor(props) {
      super(props);
    }

    state = {
      showquotes:  false,
      showabstract:  false,
    }

    handleToggleNameEdit(toggle) {
      this.props.handleUpdatePublicationEdit(this.props.id, toggle)
    }

    _handleUpdatePublicationNotes(id, nth, newValue){
      let newNotes : any[] = []
      this.props.notes.forEach(function(val,idx) {
         nth==idx ? newNotes.push(newValue) : newNotes.push(val)
      })
      this.props.handleUpdatePublicationNotes(id, newNotes)
    }

    _handleDeletePublicationNote(id, nth){
      let newNotes : any[] = []
      this.props.notes.forEach(function(val,idx) {
         if(nth!=idx){newNotes.push(val)}
      })
      this.props.handleUpdatePublicationNotes(id, newNotes)
    }

    _handleAddPublicationNote(id){
      this.props.handleUpdatePublicationNotes(id, [...this.props.notes, [""]])
    }

    _handleCrossRef(){
      fetch('https://api.crossref.org/works/'+this.props.doi)
        .then(result=>result.json())
        .then(items=>{console.log(items);alert(items.message['is-referenced-by-count']);})
    }

    onToggle = (e, name) => {
      this.setState(prevState => ({
        [name]: !prevState[name],
      }));
    }

    fileReader = new FileReader()
    handleQuoteFileRead = (e) => {
        const content = this.fileReader.result;
        if(typeof content !== 'string'){
          return;
        }
        (async ()=>{
          const dataToImport = JSON.parse(content);
          dataToImport.id = this.props.id
          await appendQuotes(dataToImport, db);
        })();
    }
    handleQuoteFileChosen = (file) => {
        this.fileReader = new FileReader();
        this.fileReader.onloadend = this.handleQuoteFileRead;
        this.fileReader.readAsText(file);
    }


    render = () => {return (<li
    style={this.props.state === 'focus' ? {
      overflow: 'hidden',
      outlineOffset: '-.5em',
      padding: '.5em .5em 1em',
      outline: '3px dashed blue',
      backgroundColor:'#ffd955',
    }:(
      this.props.state === 'processed' ? {
        overflow: 'hidden',
        backgroundColor:'#e4f0f5',
        padding: '.5em .5em 1em',
      }:(
        this.props.state === 'exluded' ? {
          backgroundColor:'#f8e1e1'
        }:{overflow: 'hidden',padding: '.5em .5em 1em',})
    )}>
    <h3><span onClick={(e) => this.handleToggleNameEdit(!this.props.edit)}
      style={{
        textDecoration : this.props.state === 'exluded' ? 'line-through':'none',
      }}
    >{this.props.title}</span><a target='_blank' href={'https://dx.doi.org/'+this.props.doi.trim()}>&#11016;</a></h3>
    <p style={{marginTop : '-1em'}}>
      <button name={'showquotes'}
        onClick={(e) => this.onToggle(e, 'showquotes')}
        style={{
          color : this.state.showquotes ? 'green':'black',
          display : this.props.quotes.filter((i) => (i.publicationId == this.props.id)).length ? 'inline-block': 'none'
        }}>Show quotes {this.props.quotes.filter((i) => (i.publicationId == this.props.id)).length}</button>&nbsp;
        <button name={'showabstract'}
          onClick={(e) => this.onToggle(e, 'showabstract')}
          style={{
            color : this.state.showabstract ? 'green':'black',
            display : this.props.abstract ? 'inline-block': 'none'
          }}>Show abstract</button>&nbsp;
        <select
          name="state"
          defaultValue={this.props.state}
          onChange={(e) =>  this.props.handleUpdatePublicationField(this.props.id, {state: e.target.value})}> // [].filter.call(e.target.options, o => o.selected).map(o => o.value))}>
          {STATES.map((i) => (<option key={i} value={i}>{i}</option>))}
        </select>&nbsp;
        <select
          name="weight"
          defaultValue={this.props.weight}
          onChange={(e) =>  this.props.handleUpdatePublicationField(this.props.id, {weight: e.target.value})}> // [].filter.call(e.target.options, o => o.selected).map(o => o.value))}>
          {WEIGHTS.map((i) => (<option key={i} value={i}>{i}</option>))}
        </select>&nbsp;
      {"id:" + this.props.id + ", "}
      {
      "notes:" + (this.props.notes ? this.props.notes.length : '0') + ", " + this.props.labels.filter((i) => (this.props.tags.includes(i.id.toString()))).map((i) => (i.title+" ")) +
      this.props.crossref['author'][0]['family'] + " - " + this.props.crossref['container-title'][0]
    }</p>
    {(this.state.showabstract ? (
      <p
      style={{
        textAlign: 'left'
      }}
      ><strong>Abstract: </strong>{this.props.abstract}</p>
    ):null)}
    {(this.state.showquotes ? (
    <div className="quotes__item--publication">{(
      this.props.quotes.filter((i) => (i.publicationId == this.props.id)).map((i) => (
        <div key={'quotewrap-'+i.id} className="quotes__item-wrap">
          {(i.labels ? (<span>{(i.labels || "")}</span>):null)}
          <div key={'quote-'+i.id} style={{border: '1px solid darkgrey', backgroundColor: 'lightgrey', padding: '.5em'}}
            title={i.labels + "\n" + i.desc} className="quotes__item">
          {i.text}
          </div>
        </div>
      ))
    )}
    </div>
    ):null)}
    {(this.props.edit ? (<div><input
      name="title"
      type="text"
      value={this.props.title}
      onChange={(e) => this.props.handleUpdatePublicationTitle(this.props.id, e.target.value)}
    />
    <input
      name="title"
      type="text"
      value={this.props.abstract}
      onChange={(e) => this.props.handleUpdatePublicationField(this.props.id, { abstract: e.target.value })}
    />
    <input
      name="done"
      type="checkbox"
      checked={this.props.done}
      onChange={(e) => this.props.handleTogglePublication(this.props.id, !this.props.done)}
    />
    <div>
      <button type="button" onClick={() =>  this._handleCrossRef()}>Check Citation(1_sec_lim)</button>
      <input type='file'
             id='file'
             className='input-file'
             accept='.json'
             onChange={(e) => this.handleQuoteFileChosen(e.target.files![0])}
      />
    </div>
    <div><h4>Notes:</h4>
    {this.props.notes.map((i, idx) => (
      <span key={'span' + idx}>
      <textarea key={idx} value={i} onChange={(e) => this._handleUpdatePublicationNotes(this.props.id, idx, e.target.value)} />
      <input type="checkbox" onChange={(e) => this._handleDeletePublicationNote(this.props.id, idx)} />
      </span>
    ))}
    <button type="button" onClick={() =>  this._handleAddPublicationNote(this.props.id)}>Add note</button></div>
    <select
      name="tags"
      defaultValue={this.props.tags}
      multiple
      onChange={(e) =>  this.props.handleUpdatePublicationTags(this.props.id, [].filter.call(e.target.options, o => o.selected).map(o => o.value))}>
      {this.props.labels.map((i) => (<option key={i.id} value={i.id}>{i.title}</option>))}
    </select>
    <button type="button" onClick={() => this.props.handleDeletePublication(this.props.id)}>Delete</button>
  </div>):null)}</li>);
  }
}

export default Publication;
