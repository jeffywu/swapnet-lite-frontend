import { Modal, Button, Row, Col, TextInput } from 'react-materialize';
import React from "react";

interface TransactModalProps {
  buttonText: string;
  submitAction: any;
  updateHelpText: any;
  maturity: number | null;
}

export class TransactModal extends React.Component<TransactModalProps, {value: string, helpText: JSX.Element}> {
  constructor(props: TransactModalProps) {
    super(props);
    this.state = {
      value: '',
      helpText: <span></span>
    };
    this.handleInputChange = this.handleInputChange.bind(this);
    this.updateHelpText = this.updateHelpText.bind(this);
  }

  handleInputChange(event: any) {
    this.setState({ value: event.target.value });
  }

  updateHelpText() {
    this.props.updateHelpText().then((helpText: JSX.Element) => {
      this.setState({ helpText: helpText });
    })
  }

  render() {
    return (
      <Modal
        actions={[
          <Button flat modal="close" node="button" waves="green">Cancel</Button>,
          <Button modal="close" node="button" waves="green"
            onClick={() => {this.props.submitAction(this.props.maturity, this.state.value)}}>
            Submit Transaction
          </Button>
        ]}
        bottomSheet
        fixedFooter={false}
        header={this.props.buttonText}
        id="modal-0"
        options={{
          dismissible: true,
          endingTop: '10%',
          inDuration: 250,
          onCloseEnd: null,
          onCloseStart: null,
          onOpenEnd: null,
          onOpenStart: this.updateHelpText,
          opacity: 0.5,
          outDuration: 250,
          preventScrolling: true,
          startingTop: '4%'
        }}
        trigger={<Button node="button">{this.props.buttonText}</Button>}
      >
        <Row className="container">
          <Col s={3}></Col>
          <Col s={6}>
            {this.state.helpText}
            <TextInput 
              label={this.props.buttonText}
              value={this.state.value}
              onChange={this.handleInputChange}
            />
          </Col>
          <Col s={3}></Col>
        </Row>
      </Modal>
    );
  }
}