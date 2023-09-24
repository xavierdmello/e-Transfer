import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { usePrivyWagmi } from "@privy-io/wagmi-connector";
import { useNetwork, useSwitchNetwork, useTransaction } from "wagmi";
import { keccak256, encodeAbiParameters, parseAbiParameters, parseUnits, formatUnits } from "viem";
import { useContractRead, usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import React from "react";
import { ref, update, set, onValue, get } from "firebase/database";
import Header from "./components/Header.tsx";
import LandingPage from "./components/LandingPage.tsx";
import Wallet from "./components/Wallet.tsx";

import {
  Button,
  Input,
  Heading,
  InputGroup,
  useToast,
  InputLeftElement,
  InputRightElement,
  Container,
  Center,
  Box,
  UnorderedList,
  Spinner,
  ListItem,
  NumberInput,
  NumberInputField,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  HStack,
  VStack,
  Grid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Select,
  Flex,
} from "@chakra-ui/react";

function App() {
  const { login, authenticated, user, ready, logout, createWallet } = usePrivy();
  const [menu, setMenu] = useState("wallet");
  const ref = React.useRef(null);

  return (
    <Box backgroundColor={["brand", "#13482e"]}>
      <Center>
        <Container
          w={["100%", "60%"]}
          maxW={"500px"}
          shadow={"sm"}
          mt={["0", "1vh"]}
          mb={["0", "1vh"]}
          border={"5px solid"}
          borderColor={"brand"}
          borderRadius={["0", "3xl"]}
          height={["100vh", "98vh"]}
          borderBottomRadius={["3xl", "0xl"]}
          padding={"0px"}
          backgroundColor={"brand"}
          overflow={"hidden"}
        >
          <Header setMenu={setMenu} menu={menu} />

          {menu === "landing" ? <LandingPage /> : <Wallet />}
        </Container>
      </Center>
    </Box>
  );
}

export default App;
